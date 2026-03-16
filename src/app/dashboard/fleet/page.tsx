
"use client"

import React from "react"
import FleetStats from "@/components/dashboard/FleetStats"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FleetPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Fleet Registry Matrix</h1>
          <p className="text-sm text-muted-foreground">Full tactical inventory of all operational assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-navy text-xs uppercase font-bold">
            <Filter className="w-3 h-3 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="border-navy text-xs uppercase font-bold">
            <Download className="w-3 h-3 mr-2" /> Export
          </Button>
        </div>
      </div>

      <FleetStats />

      <Card className="glass-panel overflow-hidden">
        <CardHeader className="p-4 bg-navy/20 border-b border-navy/20">
          <CardTitle className="text-sm font-black uppercase">Asset Manifest</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-navy/30 text-muted-foreground uppercase tracking-wider">
                <th className="p-4 font-bold border-r border-navy/20">Asset ID</th>
                <th className="p-4 font-bold border-r border-navy/20">Type</th>
                <th className="p-4 font-bold border-r border-navy/20">Status</th>
                <th className="p-4 font-bold border-r border-navy/20">Location</th>
                <th className="p-4 font-bold border-r border-navy/20">Payload</th>
                <th className="p-4 font-bold">Next Service</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/20 font-medium">
              {[
                { id: "NX-8822", type: "Heavy Transport", status: "Active", loc: "Sector 4", payload: "82%", service: "14 Days", color: "text-active" },
                { id: "NX-1049", type: "Courier Scout", status: "Idle", loc: "Main Base", payload: "0%", service: "2 Days", color: "text-idle" },
                { id: "NX-3301", type: "Repair Unit", status: "Service", loc: "Hangar 2", payload: "15%", service: "Today", color: "text-orange" },
                { id: "NX-9928", type: "Heavy Transport", status: "Emergency", loc: "Route 12", payload: "45%", service: "31 Days", color: "text-emergency" },
                { id: "NX-4412", type: "Cargo Drone", status: "Active", loc: "Sector 9", payload: "98%", service: "12 Days", color: "text-active" },
                { id: "NX-2209", type: "Courier Scout", status: "Active", loc: "Urban Hub", payload: "22%", service: "5 Days", color: "text-active" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-navy/10 transition-colors group">
                  <td className="p-4 font-mono font-bold tracking-tighter text-sm">{row.id}</td>
                  <td className="p-4">{row.type}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-pulse bg-current ${row.color}`} />
                      <span className={`font-bold uppercase text-[10px] ${row.color}`}>{row.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{row.loc}</td>
                  <td className="p-4">
                    <div className="w-24 h-1.5 bg-navy/30 rounded-full overflow-hidden">
                      <div className="h-full bg-orange" style={{ width: row.payload }} />
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-[9px] uppercase border-navy text-muted-foreground font-bold">
                      {row.service}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
