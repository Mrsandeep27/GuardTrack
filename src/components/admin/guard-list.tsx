import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime, timeAgo } from '@/lib/utils'

interface Guard {
  id: string
  name: string
  phone: string | null
  status: 'active' | 'inactive'
  current_attendance?: {
    check_in: string
  } | null
  last_attendance?: {
    check_out: string
    total_hours: number | null
  } | null
}

interface GuardListProps {
  guards: Guard[]
  loading: boolean
}

export function GuardList({ guards, loading }: GuardListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Live Guard Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {guards.map((guard) => (
            <div
              key={guard.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    guard.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <div>
                  <p className="font-medium">{guard.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {guard.status === 'active' && guard.current_attendance
                      ? `IN since ${formatTime(guard.current_attendance.check_in)}`
                      : guard.last_attendance
                      ? `OUT — last: ${timeAgo(guard.last_attendance.check_out)}`
                      : 'No records'}
                  </p>
                </div>
              </div>
              <Badge variant={guard.status === 'active' ? 'success' : 'danger'}>
                {guard.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
