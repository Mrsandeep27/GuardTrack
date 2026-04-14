import { useMemo, useCallback } from 'react'
import { useGuards } from '@/hooks/use-guards'
import { useRealtime } from '@/hooks/use-realtime'
import { GuardMap } from '@/components/admin/guard-map'

export default function AdminMap() {
  const { guards, loading, refetch } = useGuards()

  // Realtime: refetch when any attendance changes (check-in/check-out)
  const handleRealtimeUpdate = useCallback(() => {
    refetch()
  }, [refetch])
  useRealtime('attendance', handleRealtimeUpdate)

  const guardLocations = useMemo(() => {
    // Only show active (checked-in) guards on map
    return guards
      .filter(g => g.status === 'active' && g.current_attendance)
      .map(g => ({
        id: g.id,
        name: g.name,
        status: g.status,
        lat: g.current_attendance?.check_in_lat ?? null,
        lng: g.current_attendance?.check_in_lng ?? null,
      }))
  }, [guards])

  const activeCount = guardLocations.filter(g => g.lat != null).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guard Map</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeCount} active guard{activeCount !== 1 ? 's' : ''} on duty
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : activeCount === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No guards are currently checked in
        </div>
      ) : (
        <GuardMap guards={guardLocations} />
      )}
    </div>
  )
}
