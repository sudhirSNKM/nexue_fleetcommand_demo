
"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Maximize2, RefreshCw } from "lucide-react"

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

const vehicles = [
  { id: 1, plate: "TR-2024", lat: 40.7128, lng: -74.0060, status: 'active', driver: "John Doe", speed: "45 mph" },
  { id: 2, plate: "TR-5512", lat: 40.7589, lng: -73.9851, status: 'idle', driver: "Jane Smith", speed: "0 mph" },
  { id: 3, plate: "TR-9980", lat: 40.7306, lng: -73.9352, status: 'maintenance', driver: "Mike Ross", speed: "0 mph" },
  { id: 4, plate: "TR-1001", lat: 40.7831, lng: -73.9712, status: 'emergency', driver: "Alex Hunt", speed: "68 mph" },
]

export default function LiveMap() {
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet)
    })
  }, [])

  const getMarkerIcon = (status: string) => {
    if (!L) return null
    
    let color = "#00CC00"
    if (status === 'idle') color = "#FFFF00"
    if (status === 'maintenance') color = "#FF8000"
    if (status === 'emergency') color = "#FF0000"

    const svgIcon = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="8" fill="${color}" stroke="white" stroke-width="2">
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
          <animate attributeName="r" values="8;18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    `
    return L.divIcon({
      html: svgIcon,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
  }

  return (
    <Card className="glass-panel overflow-hidden h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-navy/20 border-b border-navy/20">
        <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-orange animate-spin-slow" />
          Live Tactical Map
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-[10px] bg-active/10 text-active border-active/50">4 Active</Badge>
          <button className="text-muted-foreground hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative min-h-[400px]">
        {L && (
          <MapContainer center={[40.75, -73.98]} zoom={12} className="h-full w-full" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {vehicles.map(v => (
              <Marker key={v.id} position={[v.lat, v.lng]} icon={getMarkerIcon(v.status)}>
                <Popup className="custom-popup">
                  <div className="p-2 space-y-1">
                    <p className="font-bold border-b border-navy/20 pb-1">{v.plate}</p>
                    <p className="text-xs text-muted-foreground">Driver: {v.driver}</p>
                    <p className="text-xs text-muted-foreground">Speed: <span className="text-orange">{v.speed}</span></p>
                    <div className="flex items-center gap-1 mt-2">
                       <span className={`w-2 h-2 rounded-full bg-${v.status}`} />
                       <span className="text-[10px] uppercase font-bold">{v.status}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
          <div className="bg-card/80 backdrop-blur-md p-3 rounded-lg border border-white/10 text-[10px] uppercase font-bold tracking-tighter space-y-2">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-active" /> Active Operations</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-idle" /> Standby Mode</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-maintenance" /> Maintenance Required</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emergency" /> Immediate Alert</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
