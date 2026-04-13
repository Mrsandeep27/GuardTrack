import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime, formatHours } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface AttendanceRecord {
  id: string
  check_in: string
  check_out: string | null
  total_hours: number | null
  notes: string | null
}

interface AttendanceListProps {
  records: AttendanceRecord[]
  loading: boolean
}

export function AttendanceList({ records, loading }: AttendanceListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const totalMonthHours = records
    .filter(r => {
      const d = new Date(r.check_in)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.total_hours
    })
    .reduce((sum, r) => sum + (r.total_hours || 0), 0)

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total this month</span>
            <span className="text-xl font-bold text-primary">{totalMonthHours.toFixed(1)}h</span>
          </div>
        </CardContent>
      </Card>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No attendance records yet
          </CardContent>
        </Card>
      ) : (
        records.map((record) => (
          <Card key={record.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{formatDate(record.check_in)}</span>
                {record.check_out ? (
                  <Badge variant="secondary">{formatHours(record.total_hours)}</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(record.check_in)}</span>
                </div>
                <span>—</span>
                <span>{record.check_out ? formatTime(record.check_out) : 'Active'}</span>
              </div>
              {record.notes && (
                <p className="text-xs text-yellow-400 mt-1">{record.notes}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
