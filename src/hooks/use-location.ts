import { useState, useCallback } from 'react'

interface Location {
  lat: number
  lng: number
}

export function useLocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLocation = useCallback((): Promise<Location | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported')
        resolve(null)
        return
      }

      setLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false)
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          setLoading(false)
          setError(err.message)
          resolve(null) // Still allow check-in without location
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }, [])

  return { getLocation, loading, error }
}
