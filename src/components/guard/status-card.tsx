import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'
import { formatTime, formatDuration, getElapsedSeconds } from '@/lib/utils'

interface StatusCardProps {
  activeRecord: {
    check_in: string
    check_in_lat: number | null
    check_in_lng: number | null
  } | null
  todayHours: number
  weekHours: number
}

export function StatusCard({ activeRecord, todayHours, weekHours }: StatusCardProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeRecord) return
    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(activeRecord.check_in))
    }, 1000)
    setElapsed(getElapsedSeconds(activeRecord.check_in))
    return () => clearInterval(interval)
  }, [activeRecord])

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Status</span>
          {activeRecord ? (
            <Badge variant="success">CHECKED IN</Badge>
          ) : (
            <Badge variant="danger">NOT CHECKED IN</Badge>
          )}
        </div>

        {activeRecord ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Since {formatTime(activeRecord.check_in)}</span>
            </div>
            <div className="text-center py-4">
              <span className="text-4xl font-mono font-bold text-primary">
                {formatDuration(elapsed)}
              </span>
              <p className="text-sm text-muted-foreground mt-1">Current shift</p>
            </div>
            {activeRecord.check_in_lat != null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {Math.abs(activeRecord.check_in_lat).toFixed(4)}°{activeRecord.check_in_lat >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(activeRecord.check_in_lng ?? 0).toFixed(4)}°{(activeRecord.check_in_lng ?? 0) >= 0 ? 'E' : 'W'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Tap the button below to check in</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{todayHours > 0 ? `${todayHours.toFixed(1)}h` : '--'}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{weekHours > 0 ? `${weekHours.toFixed(1)}h` : '--'}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
