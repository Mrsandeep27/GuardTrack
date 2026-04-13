import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserX,
  Timer,
  Users,
  Zap,
} from 'lucide-react'

interface Guard {
  id: string
  name: string
  status: 'active' | 'inactive'
  weekly_hours: number
  monthly_hours: number
}

interface AttendanceRecord {
  guard_id: string
  check_in: string
  check_out: string | null
  total_hours: number | null
  profiles?: { name: string }
}

interface InsightsPanelProps {
  guards: Guard[]
  records: AttendanceRecord[]
}

export function InsightsPanel({ guards, records }: InsightsPanelProps) {
  const insights = useMemo(() => {
    const now = new Date()
    const today = now.toDateString()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Top performer this week
    const topPerformer = [...guards].sort((a, b) => b.weekly_hours - a.weekly_hours)[0]

    // Least hours this week
    const leastHours = [...guards].filter(g => g.weekly_hours > 0).sort((a, b) => a.weekly_hours - b.weekly_hours)[0]

    // Late arrivals today (after 9 AM)
    const todayRecords = records.filter(r => new Date(r.check_in).toDateString() === today)
    const lateArrivals = todayRecords.filter(r => {
      const checkIn = new Date(r.check_in)
      return checkIn.getHours() >= 9
    })

    // No-shows today (guards with no check-in today)
    const checkedInToday = new Set(todayRecords.map(r => r.guard_id))
    const noShows = guards.filter(g => !checkedInToday.has(g.id))

    // Average shift duration (completed shifts this week)
    const weekRecords = records.filter(r =>
      new Date(r.check_in) >= startOfWeek && r.total_hours
    )
    const avgShift = weekRecords.length > 0
      ? weekRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0) / weekRecords.length
      : 0

    // Overtime guards (> 10 hours in a single shift)
    const overtimeShifts = records.filter(r => r.total_hours && r.total_hours > 10)

    // Total man-hours this week
    const totalManHours = guards.reduce((sum, g) => sum + g.weekly_hours, 0)

    // Average check-in time today
    let avgCheckInTime = ''
    if (todayRecords.length > 0) {
      const avgMinutes = todayRecords.reduce((sum, r) => {
        const d = new Date(r.check_in)
        return sum + d.getHours() * 60 + d.getMinutes()
      }, 0) / todayRecords.length
      const hours = Math.floor(avgMinutes / 60)
      const mins = Math.round(avgMinutes % 60)
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const h12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      avgCheckInTime = `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`
    }

    return {
      topPerformer,
      leastHours,
      lateArrivals,
      noShows,
      avgShift,
      overtimeShifts,
      totalManHours,
      avgCheckInTime,
      activeCount: guards.filter(g => g.status === 'active').length,
    }
  }, [guards, records])

  const cards = [
    {
      title: 'Top Performer',
      icon: Trophy,
      color: 'text-yellow-400',
      content: insights.topPerformer
        ? `${insights.topPerformer.name} — ${insights.topPerformer.weekly_hours.toFixed(1)}h this week`
        : 'No data',
      badge: 'Star',
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Least Hours',
      icon: AlertTriangle,
      color: 'text-orange-400',
      content: insights.leastHours
        ? `${insights.leastHours.name} — ${insights.leastHours.weekly_hours.toFixed(1)}h this week`
        : 'No data',
      badge: 'Attention',
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Late Arrivals Today',
      icon: Clock,
      color: 'text-red-400',
      content: insights.lateArrivals.length > 0
        ? `${insights.lateArrivals.length} guard${insights.lateArrivals.length > 1 ? 's' : ''} checked in after 9:00 AM`
        : 'No late arrivals today',
      badge: `${insights.lateArrivals.length}`,
      badgeVariant: insights.lateArrivals.length > 0 ? 'danger' as const : 'success' as const,
    },
    {
      title: 'No-Shows Today',
      icon: UserX,
      color: 'text-red-400',
      content: insights.noShows.length > 0
        ? `${insights.noShows.map(g => g.name).slice(0, 3).join(', ')}${insights.noShows.length > 3 ? ` +${insights.noShows.length - 3} more` : ''}`
        : 'All guards checked in',
      badge: `${insights.noShows.length}`,
      badgeVariant: insights.noShows.length > 0 ? 'danger' as const : 'success' as const,
    },
    {
      title: 'Average Shift Duration',
      icon: Timer,
      color: 'text-blue-400',
      content: insights.avgShift > 0
        ? `${insights.avgShift.toFixed(1)} hours per shift this week`
        : 'No completed shifts yet',
      badge: `${insights.avgShift.toFixed(1)}h`,
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Overtime Alerts',
      icon: Zap,
      color: 'text-purple-400',
      content: insights.overtimeShifts.length > 0
        ? `${insights.overtimeShifts.length} shift${insights.overtimeShifts.length > 1 ? 's' : ''} exceeded 10 hours`
        : 'No overtime shifts',
      badge: `${insights.overtimeShifts.length}`,
      badgeVariant: insights.overtimeShifts.length > 0 ? 'warning' as const : 'success' as const,
    },
    {
      title: 'Total Man-Hours',
      icon: Users,
      color: 'text-green-400',
      content: `${insights.totalManHours.toFixed(1)} hours total this week`,
      badge: `${insights.totalManHours.toFixed(0)}h`,
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Average Check-In Time',
      icon: TrendingUp,
      color: 'text-cyan-400',
      content: insights.avgCheckInTime
        ? `Average check-in at ${insights.avgCheckInTime} today`
        : 'No check-ins today',
      badge: insights.avgCheckInTime || '--',
      badgeVariant: 'secondary' as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <card.icon className={`h-6 w-6 ${card.color}`} />
                <div>
                  <p className="font-medium">{card.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.content}</p>
                </div>
              </div>
              <Badge variant={card.badgeVariant}>{card.badge}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
