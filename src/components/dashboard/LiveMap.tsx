
"use client"

import React, { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Maximize2, RefreshCw, Navigation, Zap, Info } from "lucide-react"

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface LiveMapProps {
  locations?: any[];
  activeRides?: any[];
}

export default function LiveMap({ locations = [], activeRides = [] }: LiveMapProps) {
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet)
    })
  }, [])

  const getMarkerIcon = (status: string, vehicleType?: string) => {
    if (!L) return null
    
    let color = "#00CC00" // active
    if (status === 'Offline') color = "#192A4D"
    if (status === 'Emergency') color = "#FF0000"
    if (status === 'Idle') color = "#FFFF00"

    const svgIcon = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="8" fill="${color}" stroke="white" stroke-width="2">
          ${status !== 'Offline' ? '<animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />' : ''}
          ${status !== 'Offline' ? '<animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />' : ''}
        </circle>
        <circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
          ${status !== 'Offline' ? '<animate attributeName="r" values="8;18" dur="2s" repeatCount="indefinite" />' : ''}
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
    <Card className="glass-panel border-none shadow-none h-full flex flex-col bg-transparent">
      <CardContent className="flex-1 p-0 relative h-full">
        {L && (
          <MapContainer center={[12.9716, 77.5946]} zoom={12} className="h-full w-full" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* RENDER LIVE DRIVER LOCATIONS */}
            {locations?.map(loc => (
              <Marker 
                key={loc.id} 
                position={[loc.lat, loc.lng]} 
                icon={getMarkerIcon(loc.status || 'Active', loc.vehicleType)}
              >
                <Popup className="custom-popup">
                  <div className="p-3 bg-charcoal text-white rounded-lg border border-white/10 shadow-2xl min-w-[180px]">
                    <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
                       <span className="text-[10px] font-black uppercase text-orange">Tactical Unit</span>
                       <Badge variant="outline" className="text-[8px] border-active/50 text-active">LIVE</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-tight">{loc.driverName || 'Operator Unknown'}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase">Class</p>
                          <p className="text-[9px] font-bold text-white uppercase">{loc.vehicleType || 'Scout'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase">Speed</p>
                          <p className="text-[9px] font-bold text-active font-mono">{loc.speed || '0'} KM/H</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase">Fuel</p>
                          <p className="text-[9px] font-bold text-orange font-mono">{loc.fuel || '88'}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase">Status</p>
                          <p className="text-[9px] font-bold text-white uppercase">{loc.status || 'Active'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* RENDER ACTIVE RIDE PICKUP/DROPOFF MARKERS IF NEEDED */}
            {activeRides?.map(ride => (
              <React.Fragment key={ride.id}>
                {ride.pickup && (
                   <Marker position={[ride.pickup.lat, ride.pickup.lng]} icon={L.divIcon({ html: '<div class="w-3 h-3 bg-active rounded-full ring-2 ring-white"></div>', className: 'pickup' })}>
                     <Popup className="custom-popup">
                        <p className="text-[8px] font-black uppercase">Active Pickup: {ride.id.substring(0,6)}</p>
                     </Popup>
                   </Marker>
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        )}

        {/* LEGEND OVERLAY */}
        <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-charcoal/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl space-y-2">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 border-b border-white/5 pb-1 flex items-center gap-2">
              <Info className="w-3 h-3" /> Unit Status Legend
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-active shadow-[0_0_8px_#00CC00]" /> <span className="text-[8px] font-black text-white/60 uppercase">Operational</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#FFFF00]" /> <span className="text-[8px] font-black text-white/60 uppercase">Idle / Standby</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange shadow-[0_0_8px_#FF8000]" /> <span className="text-[8px] font-black text-white/60 uppercase">Maintenance</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emergency shadow-[0_0_8px_#FF0000] animate-pulse" /> <span className="text-[8px] font-black text-white/60 uppercase">SOS / Violation</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
