import { useMemo } from 'react'
import { useGuards } from '@/hooks/use-guards'
import { GuardMap } from '@/components/admin/guard-map'

export default function AdminMap() {
  const { guards, loading } = useGuards()

  const guardLocations = useMemo(() => {
    return guards.map(g => ({
      id: g.id,
      name: g.name,
      status: g.status,
      lat: g.status === 'active'
        ? g.current_attendance?.check_in_lat ?? null
        : g.last_attendance?.check_out_lat ?? null,
      lng: g.status === 'active'
        ? g.current_attendance?.check_in_lng ?? null
        : g.last_attendance?.check_out_lng ?? null,
    }))
  }, [guards])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guard Map</h1>
        <p className="text-muted-foreground text-sm mt-1">Live guard locations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <GuardMap guards={guardLocations} />
      )}
    </div>
  )
}
