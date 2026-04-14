import { useAttendance } from '@/hooks/use-attendance'
import { AttendanceCalendar } from '@/components/guard/attendance-calendar'

export default function GuardAttendance() {
  const { records, loading } = useAttendance()

  return (
    <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Calendar view</p>
      </div>

      <AttendanceCalendar records={records} loading={loading} />
    </div>
  )
}
