import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useAttendance } from '@/hooks/use-attendance'
import { CheckInButton } from '@/components/guard/check-in-button'
import { StatusCard } from '@/components/guard/status-card'
import { syncPendingActions, getPendingActions } from '@/lib/offline'
import { isThisWeek } from '@/lib/utils'

export default function GuardDashboard() {
  const { profile } = useAuthStore()
  const { records, activeRecord, checkIn, checkOut, refetch } = useAttendance()
  const [syncing, setSyncing] = useState(false)

  const { todayHours, weekHours } = useMemo(() => {
    const today = new Date().toDateString()
    const todayH = records
      .filter(r => new Date(r.check_in).toDateString() === today && r.total_hours)
      .reduce((sum, r) => sum + (r.total_hours || 0), 0)
    const weekH = records
      .filter(r => isThisWeek(r.check_in) && r.total_hours)
      .reduce((sum, r) => sum + (r.total_hours || 0), 0)
    return { todayHours: todayH, weekHours: weekH }
  }, [records])

  // Sync offline actions when back online, then refresh data
  useEffect(() => {
    const syncOffline = async () => {
      const pending = await getPendingActions()
      if (pending.length > 0 && navigator.onLine) {
        setSyncing(true)
        const synced = await syncPendingActions()
        setSyncing(false)
        if (synced > 0) refetch()
      }
    }
    syncOffline()
    window.addEventListener('online', syncOffline)
    return () => window.removeEventListener('online', syncOffline)
  }, [refetch])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {profile?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {syncing && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center">
          Syncing offline check-ins...
        </div>
      )}

      <StatusCard
        activeRecord={activeRecord}
        todayHours={todayHours}
        weekHours={weekHours}
      />

      <CheckInButton
        isCheckedIn={!!activeRecord}
        onCheckIn={checkIn}
        onCheckOut={checkOut}
      />
    </div>
  )
}
