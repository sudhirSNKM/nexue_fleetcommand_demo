
"use client"

import React from "react"
import LiveMap from "@/components/dashboard/LiveMap"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Signal } from "lucide-react"

export default function MapPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Global Asset Tracking</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Signal className="w-3 h-3 text-active" /> Real-time telemetry active
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Transmitters</p>
            <p className="text-xl font-mono font-bold">12/12</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">System Latency</p>
            <p className="text-xl font-mono font-bold text-active">42ms</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1">
        <div className="xl:col-span-3 min-h-[600px]">
          <LiveMap />
        </div>
        
        <aside className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="p-4 border-b border-navy/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Navigation className="w-4 h-4 text-orange" />
                Proximity Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { id: "NX-8822", dist: "0.2mi", status: "Converging", color: "text-orange" },
                { id: "NX-1049", dist: "1.4mi", status: "Safe", color: "text-active" },
              ].map((alert) => (
                <div key={alert.id} className="p-3 bg-navy/20 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold">{alert.id}</span>
                    <Badge variant="outline" className={`${alert.color} border-current text-[8px]`}>{alert.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {alert.dist} from Sector 4
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="p-4 border-b border-navy/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Geofence Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Main Hub Perimeter</span>
                  <span className="text-active font-bold uppercase">Secure</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Logistics Port A</span>
                  <span className="text-active font-bold uppercase">Secure</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">High-Risk Route 7</span>
                  <span className="text-orange font-bold uppercase">Monitored</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
