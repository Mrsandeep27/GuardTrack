import { useCallback, useMemo } from 'react'
import { useGuards } from '@/hooks/use-guards'
import { useRealtime } from '@/hooks/use-realtime'
import { StatsCards } from '@/components/admin/stats-cards'
import { GuardList } from '@/components/admin/guard-list'

export default function AdminDashboard() {
  const { guards, loading, refetch } = useGuards()

  // Realtime subscription — refetch on any attendance change
  const handleRealtimeUpdate = useCallback(() => {
    refetch()
  }, [refetch])
  useRealtime('attendance', handleRealtimeUpdate)

  const stats = useMemo(() => {
    const activeGuards = guards.filter(g => g.status === 'active')
    const inactiveGuards = guards.filter(g => g.status === 'inactive')

    // Average hours per guard per day this week
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // Sunday = 7
    const totalWeekly = guards.reduce((sum, g) => sum + g.weekly_hours, 0)
    const avgHours = guards.length > 0 ? totalWeekly / guards.length / dayOfWeek : 0

    return {
      totalGuards: guards.length,
      activeNow: activeGuards.length,
      notCheckedIn: inactiveGuards.length,
      avgHoursToday: Math.round(avgHours * 10) / 10,
    }
  }, [guards])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time guard monitoring</p>
      </div>

      <StatsCards {...stats} guards={guards} />

      <GuardList guards={guards} loading={loading} />
    </div>
  )
}
