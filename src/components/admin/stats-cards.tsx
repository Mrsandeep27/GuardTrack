import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, UserX, Clock } from 'lucide-react'

interface StatsCardsProps {
  totalGuards: number
  activeNow: number
  notCheckedIn: number
  avgHoursToday: number
}

export function StatsCards({ totalGuards, activeNow, notCheckedIn, avgHoursToday }: StatsCardsProps) {
  const stats = [
    { label: 'Total Guards', value: totalGuards, icon: Users, color: 'text-blue-400' },
    { label: 'Active Now', value: activeNow, icon: UserCheck, color: 'text-green-400' },
    { label: 'Not Checked In', value: notCheckedIn, icon: UserX, color: 'text-red-400' },
    { label: 'Avg Hours Today', value: `${avgHoursToday.toFixed(1)}h`, icon: Clock, color: 'text-yellow-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
