import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatTime, formatHours } from '@/lib/utils'
import { Download, Search } from 'lucide-react'

interface AttendanceRecord {
  id: string
  guard_id: string
  check_in: string
  check_out: string | null
  check_in_lat: number | null
  check_in_lng: number | null
  total_hours: number | null
  profiles?: { name: string; email: string }
}

interface AttendanceTableProps {
  records: AttendanceRecord[]
  loading: boolean
  guards: { id: string; name: string; email: string }[]
  onFilter: (guardId?: string, startDate?: string, endDate?: string) => void
}

export function AttendanceTable({ records, loading, guards, onFilter }: AttendanceTableProps) {
  const [guardFilter, setGuardFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleFilter = () => {
    onFilter(guardFilter || undefined, startDate || undefined, endDate || undefined)
  }

  const handleReset = () => {
    setGuardFilter('')
    setStartDate('')
    setEndDate('')
    onFilter()
  }

  const exportCSV = () => {
    const escapeCSV = (val: string) => val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
    const headers = ['Guard', 'Date', 'Check In', 'Check Out', 'Hours', 'Latitude', 'Longitude']
    const rows = records.map(r => [
      escapeCSV(r.profiles?.name || ''),
      formatDate(r.check_in),
      formatTime(r.check_in),
      r.check_out ? formatTime(r.check_out) : 'Active',
      r.total_hours?.toFixed(2) || '',
      r.check_in_lat?.toString() || '',
      r.check_in_lng?.toString() || '',
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalHours = records
    .filter(r => r.total_hours)
    .reduce((sum, r) => sum + (r.total_hours || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Attendance Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={guardFilter}
            onChange={(e) => setGuardFilter(e.target.value)}
          >
            <option value="">All Guards</option>
            {guards.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <Input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={handleFilter} size="sm">
            <Search className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            Reset
          </Button>
        </div>

        {/* Summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          {records.length} records — Total: <span className="font-bold text-foreground">{totalHours.toFixed(1)}h</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Guard</th>
                  <th className="text-left py-3 px-2 font-medium">Date</th>
                  <th className="text-left py-3 px-2 font-medium">Check In</th>
                  <th className="text-left py-3 px-2 font-medium">Check Out</th>
                  <th className="text-left py-3 px-2 font-medium">Hours</th>
                  <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Location</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-border/50 hover:bg-accent/50">
                    <td className="py-3 px-2 font-medium">{record.profiles?.name || 'Unknown'}</td>
                    <td className="py-3 px-2">{formatDate(record.check_in)}</td>
                    <td className="py-3 px-2">{formatTime(record.check_in)}</td>
                    <td className="py-3 px-2">
                      {record.check_out ? (
                        formatTime(record.check_out)
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2">{formatHours(record.total_hours)}</td>
                    <td className="py-3 px-2 hidden lg:table-cell text-xs text-muted-foreground">
                      {record.check_in_lat != null
                        ? `${record.check_in_lat.toFixed(4)}, ${record.check_in_lng?.toFixed(4)}`
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
