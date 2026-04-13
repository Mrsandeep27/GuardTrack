import { useGuards, useAllAttendance } from '@/hooks/use-guards'
import { AttendanceTable } from '@/components/admin/attendance-table'

export default function AdminAttendance() {
  const { guards } = useGuards()
  const { records, loading, fetchAll } = useAllAttendance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">View and filter all attendance records</p>
      </div>

      <AttendanceTable
        records={records}
        loading={loading}
        guards={guards.map(g => ({ id: g.id, name: g.name, email: g.email }))}
        onFilter={fetchAll}
      />
    </div>
  )
}
