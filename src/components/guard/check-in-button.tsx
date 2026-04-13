import { useState, useRef, useEffect } from 'react'
import { MapPin, LogIn, LogOut, Loader2, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from '@/hooks/use-location'

interface CheckInButtonProps {
  isCheckedIn: boolean
  onCheckIn: (lat: number | null, lng: number | null) => Promise<any>
  onCheckOut: (lat: number | null, lng: number | null) => Promise<any>
}

export function CheckInButton({ isCheckedIn, onCheckIn, onCheckOut }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [error, setError] = useState<string | null>(null)
  const lockRef = useRef(false)
  const { getLocation } = useLocation()

  // Reactive online/offline status
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const handleAction = async () => {
    // Prevent double-clicks with ref lock (survives React batching)
    if (lockRef.current) return
    lockRef.current = true
    setLoading(true)
    setError(null)
    try {
      const location = await getLocation()
      let result
      if (isCheckedIn) {
        result = await onCheckOut(location?.lat ?? null, location?.lng ?? null)
      } else {
        result = await onCheckIn(location?.lat ?? null, location?.lng ?? null)
      }
      if (result?.error) {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || 'Action failed')
    } finally {
      setLoading(false)
      lockRef.current = false
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="xl"
        onClick={handleAction}
        disabled={loading}
        className={`w-full max-w-xs h-20 text-xl font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
          isCheckedIn
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
        ) : isCheckedIn ? (
          <LogOut className="h-6 w-6 mr-2" />
        ) : (
          <LogIn className="h-6 w-6 mr-2" />
        )}
        {loading ? 'Getting Location...' : isCheckedIn ? 'CHECK OUT' : 'CHECK IN'}
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Location will be recorded</span>
      </div>

      {error && (
        <div className="text-sm text-red-400 text-center">{error}</div>
      )}

      {!online && (
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          <WifiOff className="h-4 w-4" />
          <span>Offline — will sync when connected</span>
        </div>
      )}
    </div>
  )
}
