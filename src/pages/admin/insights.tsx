import { useGuards, useAllAttendance } from '@/hooks/use-guards'
import { InsightsPanel } from '@/components/admin/insights-panel'

export default function AdminInsights() {
  const { guards } = useGuards()
  const { records } = useAllAttendance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Smart Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">Analytics and performance metrics</p>
      </div>

      <InsightsPanel guards={guards} records={records} />
    </div>
  )
}
