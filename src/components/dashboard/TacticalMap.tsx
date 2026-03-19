
"use client"

import React, { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation, MapPin } from "lucide-react"

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

interface MapProps {
  markers?: Array<{ id: string; lat: number; lng: number; label: string; type: 'driver' | 'pickup' | 'dropoff' }> | null;
  route?: [number, number][] | null;
  center?: [number, number];
  zoom?: number;
}

export default function TacticalMap({ markers = [], route = [], center = [12.9716, 77.5946], zoom = 13 }: MapProps) {
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet)
    })
  }, [])

  const getIcon = (type: string) => {
    if (!L) return null
    const color = type === 'driver' ? '#FF8000' : type === 'pickup' ? '#00CC00' : '#FF0000'
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="8" fill="${color}" stroke="white" stroke-width="2">
          ${type === 'driver' ? '<animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />' : ''}
        </circle>
        <circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="1" opacity="0.3" />
      </svg>
    `
    return L.divIcon({ html: svg, className: 'custom-icon', iconSize: [32, 32], iconAnchor: [16, 16] })
  }

  const safeMarkers = markers || []
  const safeRoute = route || []

  return (
    <Card className="glass-panel overflow-hidden h-full min-h-[250px] lg:min-h-[400px]">
      <CardContent className="p-0 h-full relative">
        {L && (
          <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
            />
            {safeMarkers.map(m => (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={getIcon(m.type)}>
                <Popup className="custom-popup">
                  <div className="p-2">
                    <p className="font-bold text-xs uppercase">{m.label}</p>
                    <Badge variant="outline" className="mt-1 text-[8px]">{m.type}</Badge>
                  </div>
                </Popup>
              </Marker>
            ))}
            {safeRoute.length > 0 && (
              <Polyline positions={safeRoute} color="#FF8000" weight={4} opacity={0.6} dashArray="10, 10" />
            )}
          </MapContainer>
        )}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
           <Badge className="bg-charcoal/80 backdrop-blur-md border-orange/50 text-orange flex items-center gap-2">
             <Navigation className="w-3 h-3 animate-pulse" /> Live Telemetry
           </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
