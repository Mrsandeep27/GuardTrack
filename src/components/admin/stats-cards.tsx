import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Clock, X } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface Guard {
  id?: string
  name: string
  status: 'active' | 'inactive'
  current_attendance?: { check_in: string } | null
}

interface StatsCardsProps {
  totalGuards: number
  activeNow: number
  notCheckedIn: number
  avgHoursToday: number
  guards?: Guard[]
}

export function StatsCards({ totalGuards, activeNow, notCheckedIn, avgHoursToday, guards = [] }: StatsCardsProps) {
  const [showActive, setShowActive] = useState(false)

  const activeGuards = guards.filter(g => g.status === 'active')

  const stats = [
    { key: 'total', label: 'Total Guards', value: totalGuards, icon: Users, color: 'text-blue-400', clickable: false },
    { key: 'active', label: 'Active Now', value: activeNow, icon: UserCheck, color: 'text-green-400', clickable: true },
    { key: 'inactive', label: 'Not Checked In', value: notCheckedIn, icon: UserX, color: 'text-red-400', clickable: false },
    { key: 'avg', label: 'Avg Hours Today', value: `${avgHoursToday.toFixed(1)}h`, icon: Clock, color: 'text-yellow-400', clickable: false },
  ]

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.key}
            className={stat.clickable ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
            onClick={() => { if (stat.key === 'active') setShowActive(!showActive) }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
              {stat.key === 'active' && (
                <p className="text-xs text-muted-foreground mt-2">Tap to view list</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active guards popup */}
      {showActive && (
        <Card className="border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-green-400">Active Guards ({activeGuards.length})</p>
              <button onClick={() => setShowActive(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {activeGuards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No guards currently checked in</p>
            ) : (
              <div className="space-y-2">
                {activeGuards.map((g) => (
                  <div key={g.id || g.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">{g.name}</span>
                    </div>
                    <Badge variant="success">
                      {g.current_attendance ? `Since ${formatTime(g.current_attendance.check_in)}` : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
