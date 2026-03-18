
"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  Layers, 
  Map as MapIcon, 
  Plus, 
  ShieldCheck, 
  Activity, 
  AlertTriangle,
  Globe,
  Maximize2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import LiveMap from "@/components/dashboard/LiveMap"

export default function ZonesManagementPage() {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Zone Architecture</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Sector Boundary & Geofencing Control</p>
        </div>
        <div className="flex gap-4">
          <Button className="bg-orange text-white font-black uppercase text-[10px] h-11 px-6 shadow-lg shadow-orange/20 border-none">
            <Plus className="w-4 h-4 mr-2" /> Define New Sector
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1">
        <div className="xl:col-span-3 min-h-[600px] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl bg-navy/20">
          <LiveMap />
          <div className="absolute top-4 left-4 z-[1000]">
            <Badge className="bg-charcoal/90 backdrop-blur-md border-active/50 text-active flex items-center gap-2 px-3 py-1.5 font-black uppercase text-[10px]">
              <Globe className="w-3 h-3 animate-spin-slow" /> Global Mesh Active
            </Badge>
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel border-none shadow-xl">
            <CardHeader className="p-4 bg-navy/20 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase text-white/60 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange" /> Active Service Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-white/5">
                {[
                  { name: "Sector 1: Downtown", status: "Nominal", units: 12, health: "Optimal" },
                  { name: "Sector 4: Industrial", status: "Restricted", units: 4, health: "Monitoring" },
                  { name: "Sector 7: Residential", status: "High Demand", units: 28, health: "Surging" },
                ].map((zone, i) => (
                  <div key={i} className="p-4 hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black text-white uppercase">{zone.name}</p>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase",
                        zone.status === 'Nominal' ? "border-active text-active" : "border-orange text-orange"
                      )}>
                        {zone.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-white/40">
                      <span>Active Units: {zone.units}</span>
                      <span className="text-active">{zone.health}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-emergency">
            <CardHeader className="p-4 bg-emergency/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase text-emergency flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 animate-pulse" /> Geofence Violations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-white/60 uppercase text-center py-4">
                No unauthorized sector entries detected in current window.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
