import { useGuards } from '@/hooks/use-guards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatHours } from '@/lib/utils'

export default function AdminGuards() {
  const { guards, loading } = useGuards()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Guards</h1>
        <p className="text-muted-foreground text-sm mt-1">{guards.length} guards registered</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Phone</th>
                    <th className="text-left py-3 px-2 font-medium">Weekly</th>
                    <th className="text-left py-3 px-2 font-medium">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {guards.map((guard) => (
                    <tr key={guard.id} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{guard.name}</p>
                          <p className="text-xs text-muted-foreground">{guard.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={guard.status === 'active' ? 'success' : 'danger'}>
                          {guard.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell text-muted-foreground">
                        {guard.phone || '--'}
                      </td>
                      <td className="py-3 px-2">{formatHours(guard.weekly_hours)}</td>
                      <td className="py-3 px-2">{formatHours(guard.monthly_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
