import { useEffect, useCallback } from 'react'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Guard {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
}

interface GuardWithStatus extends Guard {
  status: 'active' | 'inactive'
  current_attendance?: {
    id: string
    check_in: string
    check_in_lat: number | null
    check_in_lng: number | null
  } | null
  last_attendance?: {
    check_out: string
    check_out_lat: number | null
    check_out_lng: number | null
    total_hours: number | null
  } | null
  weekly_hours: number
  monthly_hours: number
}

interface AttendanceWithProfile {
  id: string
  guard_id: string
  check_in: string
  check_out: string | null
  check_in_lat: number | null
  check_in_lng: number | null
  check_out_lat: number | null
  check_out_lng: number | null
  total_hours: number | null
  notes: string | null
  profiles?: { name: string; email: string }
}

// ── Shared Zustand store ──────────────────────────────────
// All admin pages share this single cache. Data is fetched once
// and reused until stale (30s) or a realtime event arrives.

const STALE_MS = 30_000 // consider data stale after 30s

interface GuardsStore {
  guards: GuardWithStatus[]
  guardsLoading: boolean
  guardsFetchedAt: number

  allRecords: AttendanceWithProfile[]
  recordsLoading: boolean
  recordsFetchedAt: number

  fetchGuards: (force?: boolean) => Promise<void>
  fetchAllAttendance: (guardId?: string, startDate?: string, endDate?: string) => Promise<void>

  // internal fetch deduplication
  _guardsFetching: boolean
  _recordsFetching: boolean

  // realtime subscription management
  _realtimeSetup: boolean
  _setupRealtime: () => void
}

const useGuardsStore = create<GuardsStore>((set, get) => ({
  guards: [],
  guardsLoading: true,
  guardsFetchedAt: 0,

  allRecords: [],
  recordsLoading: true,
  recordsFetchedAt: 0,

  _realtimeSetup: false,

  _guardsFetching: false,
  _recordsFetching: false,

  fetchGuards: async (force = false) => {
    const { guardsFetchedAt, _guardsFetching } = get()
    const now = Date.now()

    // Skip if fresh data exists and not forced
    if (!force && guardsFetchedAt > 0 && now - guardsFetchedAt < STALE_MS) return
    // Skip if already fetching (unless forced — e.g. realtime)
    if (!force && _guardsFetching) return

    set({ _guardsFetching: true })
    // Only show loading spinner on initial load
    if (guardsFetchedAt === 0) set({ guardsLoading: true })

    try {
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guard')
        .order('name')

      if (profilesErr) console.error('Guards fetch error:', profilesErr.message)
      if (!profiles) { set({ guardsLoading: false, _guardsFetching: false }); return }

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31)
      const { data: attendance, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .gte('check_in', thirtyDaysAgo.toISOString())
        .order('check_in', { ascending: false })

      if (attErr) console.error('Attendance fetch error:', attErr.message)

      const now2 = new Date()
      const startOfWeek = new Date(now2)
      startOfWeek.setDate(now2.getDate() - now2.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1)

      const guardsWithStatus: GuardWithStatus[] = profiles.map((guard) => {
        const guardAttendance = (attendance || []).filter(a => a.guard_id === guard.id)

        const activeSession = guardAttendance.find(a => {
          if (a.check_out) return false
          const checkIn = new Date(a.check_in)
          const today = new Date()
          return checkIn.toDateString() === today.toDateString()
        })

        const lastCompleted = guardAttendance.find(a => a.check_out)

        const weeklyHours = guardAttendance
          .filter(a => a.total_hours && new Date(a.check_in) >= startOfWeek)
          .reduce((sum, a) => sum + (a.total_hours || 0), 0)

        const monthlyHours = guardAttendance
          .filter(a => a.total_hours && new Date(a.check_in) >= startOfMonth)
          .reduce((sum, a) => sum + (a.total_hours || 0), 0)

        return {
          ...guard,
          status: activeSession ? 'active' as const : 'inactive' as const,
          current_attendance: activeSession ? {
            id: activeSession.id,
            check_in: activeSession.check_in,
            check_in_lat: activeSession.check_in_lat,
            check_in_lng: activeSession.check_in_lng,
          } : null,
          last_attendance: lastCompleted ? {
            check_out: lastCompleted.check_out,
            check_out_lat: lastCompleted.check_out_lat,
            check_out_lng: lastCompleted.check_out_lng,
            total_hours: lastCompleted.total_hours,
          } : null,
          weekly_hours: Math.round(weeklyHours * 100) / 100,
          monthly_hours: Math.round(monthlyHours * 100) / 100,
        }
      })

      set({ guards: guardsWithStatus, guardsLoading: false, guardsFetchedAt: Date.now(), _guardsFetching: false })
    } catch (err) {
      console.error('fetchGuards failed:', err)
      set({ guardsLoading: false, _guardsFetching: false })
    }
  },

  fetchAllAttendance: async (guardId?: string, startDate?: string, endDate?: string) => {
    const { recordsFetchedAt, _recordsFetching } = get()
    const isFiltered = !!(guardId || startDate || endDate)

    // Skip if unfiltered + fresh cache
    if (!isFiltered && recordsFetchedAt > 0 && Date.now() - recordsFetchedAt < STALE_MS) return
    // Skip if already fetching (unless it's a new filter request)
    if (!isFiltered && _recordsFetching) return

    set({ _recordsFetching: true })
    // Only show loading on initial load or filtered queries
    if (recordsFetchedAt === 0 || isFiltered) set({ recordsLoading: true })

    try {
      let query = supabase
        .from('attendance')
        .select('*, profiles!attendance_guard_id_fkey(name, email)')
        .order('check_in', { ascending: false })
        .limit(1000)

      if (guardId) query = query.eq('guard_id', guardId)
      if (startDate) query = query.gte('check_in', startDate)
      if (endDate) query = query.lte('check_in', endDate + 'T23:59:59')

      const { data, error } = await query
      if (error) console.error('Attendance records fetch error:', error.message)
      set({ allRecords: data || [], recordsLoading: false, recordsFetchedAt: Date.now(), _recordsFetching: false })
    } catch (err) {
      console.error('fetchAllAttendance failed:', err)
      set({ recordsLoading: false, _recordsFetching: false })
    }
  },

  _setupRealtime: () => {
    if (get()._realtimeSetup) return
    set({ _realtimeSetup: true })

    supabase
      .channel('realtime-attendance-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          // Silently refresh both caches
          get().fetchGuards(true)
          get().fetchAllAttendance()
        }
      )
      .subscribe()
  },
}))


// ── Hook wrappers (drop-in replacements) ──────────────────

export function useGuards() {
  const { guards, guardsLoading: loading, fetchGuards, _setupRealtime } = useGuardsStore()

  useEffect(() => {
    fetchGuards()
    _setupRealtime()
  }, [fetchGuards, _setupRealtime])

  const refetch = useCallback(() => fetchGuards(true), [fetchGuards])

  return { guards, loading, refetch }
}

export function useAllAttendance() {
  const { allRecords: records, recordsLoading: loading, fetchAllAttendance } = useGuardsStore()

  useEffect(() => {
    fetchAllAttendance()
  }, [fetchAllAttendance])

  return { records, loading, fetchAll: fetchAllAttendance }
}
