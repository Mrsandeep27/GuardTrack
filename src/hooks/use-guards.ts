import { useState, useEffect, useCallback } from 'react'
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

export function useGuards() {
  const [guards, setGuards] = useState<GuardWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGuards = useCallback(async () => {
    setLoading(true)

    // Fetch all guard profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'guard')
      .order('name')

    if (!profiles) { setLoading(false); return }

    // Fetch attendance records for the last 31 days (enough for monthly calc)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31)
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .gte('check_in', thirtyDaysAgo.toISOString())
      .order('check_in', { ascending: false })

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const guardsWithStatus: GuardWithStatus[] = profiles.map((guard) => {
      const guardAttendance = (attendance || []).filter(a => a.guard_id === guard.id)

      // Current active session (checked in, not checked out, today)
      const activeSession = guardAttendance.find(a => {
        if (a.check_out) return false
        const checkIn = new Date(a.check_in)
        const today = new Date()
        return checkIn.toDateString() === today.toDateString()
      })

      // Last completed session
      const lastCompleted = guardAttendance.find(a => a.check_out)

      // Weekly hours
      const weeklyHours = guardAttendance
        .filter(a => a.total_hours && new Date(a.check_in) >= startOfWeek)
        .reduce((sum, a) => sum + (a.total_hours || 0), 0)

      // Monthly hours
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

    setGuards(guardsWithStatus)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGuards()
  }, [fetchGuards])

  return { guards, loading, refetch: fetchGuards }
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

export function useAllAttendance() {
  const [records, setRecords] = useState<AttendanceWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (guardId?: string, startDate?: string, endDate?: string) => {
    setLoading(true)
    let query = supabase
      .from('attendance')
      .select('*, profiles!attendance_guard_id_fkey(name, email)')
      .order('check_in', { ascending: false })
      .limit(1000)

    if (guardId) query = query.eq('guard_id', guardId)
    if (startDate) query = query.gte('check_in', startDate)
    if (endDate) query = query.lte('check_in', endDate + 'T23:59:59')

    const { data } = await query
    setRecords(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { records, loading, fetchAll }
}
