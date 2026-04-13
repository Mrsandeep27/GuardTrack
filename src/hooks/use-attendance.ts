import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { saveOfflineAction, isOnline } from '@/lib/offline'

interface AttendanceRecord {
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
}

export function useAttendance() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('guard_id', user.id)
      .order('check_in', { ascending: false })

    if (data) {
      setRecords(data)
      // Only find active record from TODAY (prevents stale check-ins from locking guard out)
      const today = new Date().toDateString()
      const active = data.find(r => !r.check_out && new Date(r.check_in).toDateString() === today)
      setActiveRecord(active || null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const checkIn = async (lat: number | null, lng: number | null): Promise<{ error?: string } | void> => {
    if (!user) return { error: 'Not authenticated' }
    // Prevent duplicate active sessions
    if (activeRecord) return { error: 'Already checked in' }

    if (!isOnline()) {
      await saveOfflineAction({
        type: 'check-in',
        guard_id: user.id,
        timestamp: new Date().toISOString(),
        lat,
        lng,
      })
      // Create optimistic record for UI
      const optimistic: AttendanceRecord = {
        id: 'offline-' + Date.now(),
        guard_id: user.id,
        check_in: new Date().toISOString(),
        check_out: null,
        check_in_lat: lat,
        check_in_lng: lng,
        check_out_lat: null,
        check_out_lng: null,
        total_hours: null,
        notes: 'Offline check-in — will sync',
      }
      setActiveRecord(optimistic)
      setRecords(prev => [optimistic, ...prev])
      return
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        guard_id: user.id,
        check_in: new Date().toISOString(),
        check_in_lat: lat,
        check_in_lng: lng,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }
    if (data) {
      setActiveRecord(data)
      setRecords(prev => [data, ...prev])
    }
  }

  const checkOut = async (lat: number | null, lng: number | null) => {
    if (!user || !activeRecord) return

    const checkOutTime = new Date()
    const checkInTime = new Date(activeRecord.check_in)
    const totalHours = Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / 3600000) * 100) / 100

    if (!isOnline()) {
      await saveOfflineAction({
        type: 'check-out',
        guard_id: user.id,
        timestamp: checkOutTime.toISOString(),
        lat,
        lng,
        attendance_id: activeRecord.id,
      })
      setActiveRecord(null)
      setRecords(prev =>
        prev.map(r => r.id === activeRecord.id
          ? { ...r, check_out: checkOutTime.toISOString(), total_hours: totalHours, notes: 'Offline check-out — will sync' }
          : r
        )
      )
      return
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: checkOutTime.toISOString(),
        check_out_lat: lat,
        check_out_lng: lng,
        total_hours: totalHours,
      })
      .eq('id', activeRecord.id)
      .select()
      .single()

    if (!error && data) {
      setActiveRecord(null)
      setRecords(prev => prev.map(r => r.id === data.id ? data : r))
    }
    return { data, error }
  }

  return { records, activeRecord, loading, checkIn, checkOut, refetch: fetchRecords }
}
