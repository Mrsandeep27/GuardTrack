import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, formatHours } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface AttendanceRecord {
  id: string
  check_in: string
  check_out: string | null
  total_hours: number | null
  notes: string | null
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  loading: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AttendanceCalendar({ records, loading }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Group records by date string
  const recordsByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord[]> = {}
    records.forEach(r => {
      const d = new Date(r.check_in)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [records])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const t = new Date()
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`

    const days: { date: string; day: number; isToday: boolean; records: AttendanceRecord[] }[] = []

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: '', day: 0, isToday: false, records: [] })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: dateStr,
        day: d,
        isToday: dateStr === today,
        records: recordsByDate[dateStr] || [],
      })
    }
    return days
  }, [currentMonth, recordsByDate])

  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const totalMonthHours = useMemo(() => {
    return calendarDays
      .flatMap(d => d.records)
      .filter(r => r.total_hours)
      .reduce((sum, r) => sum + (r.total_hours || 0), 0)
  }, [calendarDays])

  const selectedRecords = selectedDate ? (recordsByDate[selectedDate] || []) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Month total */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total this month</span>
            <span className="text-xl font-bold text-primary">{totalMonthHours.toFixed(1)}h</span>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-4 pb-2">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              if (!cell.date) {
                return <div key={`empty-${i}`} className="aspect-square" />
              }

              const hasRecords = cell.records.length > 0
              const totalH = cell.records.reduce((s, r) => s + (r.total_hours || 0), 0)
              const hasActive = cell.records.some(r => !r.check_out)
              const isSelected = selectedDate === cell.date

              return (
                <button
                  key={cell.date}
                  onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors relative
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${cell.isToday && !isSelected ? 'ring-1 ring-primary' : ''}
                    ${hasRecords && !isSelected ? 'bg-green-500/15 text-green-400' : ''}
                    ${!hasRecords && !isSelected ? 'hover:bg-accent' : ''}
                  `}
                >
                  <span className={`font-medium ${cell.isToday ? 'text-primary' : ''} ${isSelected ? 'text-primary-foreground' : ''}`}>
                    {cell.day}
                  </span>
                  {hasRecords && (
                    <span className={`text-[9px] leading-none mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {hasActive ? 'IN' : `${totalH.toFixed(1)}h`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day details */}
      {selectedDate && (
        <Card>
          <CardContent className="pt-4">
            <p className="font-medium mb-3">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
            {selectedRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance this day</p>
            ) : (
              <div className="space-y-2">
                {selectedRecords.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatTime(r.check_in)}</span>
                      <span className="text-muted-foreground">—</span>
                      <span>{r.check_out ? formatTime(r.check_out) : 'Active'}</span>
                    </div>
                    {r.check_out ? (
                      <Badge variant="secondary">{formatHours(r.total_hours)}</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
