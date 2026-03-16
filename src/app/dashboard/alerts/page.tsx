
"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ShieldAlert, CheckCircle2, Info, Clock, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AlertsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-emergency flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
            Safety & Alerts Terminal
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Security breach monitoring and active hazard logging</p>
        </div>
        <Button variant="outline" className="border-emergency/30 text-emergency hover:bg-emergency/10 text-xs uppercase font-bold">
          <BellOff className="w-4 h-4 mr-2" /> Silence All Alerts
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Active Incidents</h3>
          {[
            { id: "AL-102", type: "CRITICAL", msg: "Unscheduled Stop - NX-8822", zone: "Industrial Way", time: "2m ago", severity: "high" },
            { id: "AL-105", type: "WARNING", msg: "Low Fuel Level - NX-1049", zone: "Sector 4 Depot", time: "14m ago", severity: "medium" },
            { id: "AL-108", type: "INFO", msg: "Route Deviation Detected", zone: "Downtown Loop", time: "22m ago", severity: "low" },
          ].map((alert) => (
            <Card key={alert.id} className={`glass-panel border-l-4 ${
              alert.severity === 'high' ? 'border-emergency' : 
              alert.severity === 'medium' ? 'border-orange' : 
              'border-navy'
            }`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${
                    alert.severity === 'high' ? 'bg-emergency/10 text-emergency animate-pulse' : 
                    alert.severity === 'medium' ? 'bg-orange/10 text-orange' : 
                    'bg-navy/10 text-muted-foreground'
                  }`}>
                    {alert.severity === 'high' ? <ShieldAlert className="w-5 h-5" /> : 
                     alert.severity === 'medium' ? <AlertCircle className="w-5 h-5" /> : 
                     <Info className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold tracking-tighter text-muted-foreground">{alert.id}</span>
                      <Badge className={
                        alert.severity === 'high' ? 'bg-emergency/20 text-emergency border-emergency/30' : 
                        alert.severity === 'medium' ? 'bg-orange/20 text-orange border-orange/30' : 
                        'bg-navy/20 text-muted-foreground border-navy'
                      }>
                        {alert.type}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm uppercase tracking-tight">{alert.msg}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Zone: {alert.zone} • Timestamp: {alert.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button size="sm" variant="outline" className="text-[10px] uppercase font-bold border-navy">Dismiss</Button>
                   <Button size="sm" className="text-[10px] uppercase font-bold bg-navy/40 hover:bg-orange">Deploy Support</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-active" />
                History Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-navy/20">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 flex items-center gap-3 hover:bg-navy/5 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-active opacity-50" />
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground">Alert AL-09{i} Resolved</p>
                      <p className="text-[9px] uppercase font-medium">Status: Operations Nominal</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
