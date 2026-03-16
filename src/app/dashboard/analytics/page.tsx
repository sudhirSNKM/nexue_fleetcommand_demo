
"use client"

import React from "react"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart3, TrendingUp, Zap, PieChart } from "lucide-react"
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart as RePieChart,
  Pie
} from "recharts"

const pieData = [
  { name: 'Fuel', value: 400, color: '#FF8000' },
  { name: 'Maintenance', value: 300, color: '#192A4D' },
  { name: 'Wages', value: 300, color: '#00CC00' },
  { name: 'Tolls', value: 200, color: '#64748b' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Strategic Intelligence</h1>
          <p className="text-sm text-muted-foreground">Deep data auditing and resource optimization telemetry</p>
        </div>
        <div className="flex gap-2">
           <Badge className="bg-orange/20 text-orange border-orange/40 font-mono">Q3 REPORTING PHASE</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FuelAnalytics />
        
        <Card className="glass-panel">
          <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
            <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange" />
              Operational Cost Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131518', border: '1px solid #192A4D', fontSize: '12px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 ml-4">
                 {pieData.map((item) => (
                   <div key={item.name} className="flex items-center gap-2 text-[10px] uppercase font-bold">
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                     <span className="text-muted-foreground">{item.name}:</span>
                     <span>{((item.value/1200)*100).toFixed(0)}%</span>
                   </div>
                 ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-l-4 border-active p-6">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Efficiency Rating</p>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-black font-mono">92.4</h4>
            <span className="text-xs text-active font-bold uppercase pb-1">+1.2%</span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-2 font-medium">Outperforming benchmark in 4/5 sectors</p>
        </Card>

        <Card className="glass-panel border-l-4 border-orange p-6">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Carbon Footprint</p>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-black font-mono text-orange">2.8t</h4>
            <span className="text-xs text-emergency font-bold uppercase pb-1">+0.4%</span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-2 font-medium">Offset protocol initiated at 04:00</p>
        </Card>

        <Card className="glass-panel border-l-4 border-navy p-6">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Resource Utilization</p>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-black font-mono">76%</h4>
            <span className="text-xs text-active font-bold uppercase pb-1">Optimal</span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-2 font-medium">Fleet rotation scheduled for 22:00</p>
        </Card>
      </div>
    </div>
  )
}
