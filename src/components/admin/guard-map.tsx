import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GuardLocation {
  id: string
  name: string
  status: 'active' | 'inactive'
  lat: number | null
  lng: number | null
}

interface GuardMapProps {
  guards: GuardLocation[]
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export function GuardMap({ guards }: GuardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up existing map
    if (mapInstance.current) {
      mapInstance.current.remove()
    }

    const map = L.map(mapRef.current).setView([12.9716, 77.5946], 11)
    mapInstance.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const bounds: L.LatLngExpression[] = []

    guards.forEach((guard) => {
      if (guard.lat != null && guard.lng != null) {
        const icon = guard.status === 'active' ? greenIcon : redIcon
        const marker = L.marker([guard.lat, guard.lng], { icon }).addTo(map)
        const container = document.createElement('div')
        const nameEl = document.createElement('strong')
        nameEl.textContent = guard.name
        const statusEl = document.createElement('span')
        statusEl.textContent = guard.status === 'active' ? ' — Active' : ' — Inactive'
        container.appendChild(nameEl)
        container.appendChild(statusEl)
        marker.bindPopup(container)
        bounds.push([guard.lat, guard.lng])
      }
    })

    // Leaflet needs the container to be fully laid out before sizing tiles
    map.invalidateSize()
    requestAnimationFrame(() => {
      map.invalidateSize()
      if (bounds.length > 0) {
        try {
          map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] })
        } catch {
          // ignore resize errors
        }
      }
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [guards])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guard Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Active — on duty</span>
          </div>
        </div>
        <div ref={mapRef} className="h-[calc(100vh-380px)] min-h-[250px] max-h-[600px] rounded-lg overflow-hidden" />
      </CardContent>
    </Card>
  )
}
