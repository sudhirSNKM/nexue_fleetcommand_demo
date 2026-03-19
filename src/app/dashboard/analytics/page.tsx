
"use client"

import React, { useMemo } from "react"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, TrendingUp, Zap, BarChart3, ShieldCheck, Activity } from "lucide-react"
import { 
  ResponsiveContainer, 
  Tooltip, 
  Cell,
  PieChart as RePieChart,
  Pie
} from "recharts"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function AnalyticsPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const ridesQuery = useMemoFirebase(() => (db && user) ? collection(db, "rides") : null, [db, user])
  const { data: rides } = useCollection(ridesQuery)

  const driversQuery = useMemoFirebase(() => (db && user) ? query(collection(db, "userProfiles"), where("role", "==", "driver")) : null, [db, user])
  const { data: drivers } = useCollection(driversQuery)

  const stats = useMemo(() => {
    if (!rides) return { efficiency: 0, carbon: 0, utilization: 0, pieData: [] }
    
    const completed = rides.filter(r => r.status === 'Completed' || r.status === 'Paid')
    const efficiency = rides.length > 0 ? (completed.length / rides.length) * 100 : 0
    const totalDistance = completed.reduce((acc, r) => acc + (Number(r.distance) || 0), 0)
    const carbon = totalDistance * 0.12 // Mock calculation: 0.12kg CO2 per KM
    
    const serviceBreakdown = completed.reduce((acc: any, r) => {
      acc[r.serviceType] = (acc[r.serviceType] || 0) + (Number(r.fare) || 0)
      return acc
    }, {})

    const pieData = Object.entries(serviceBreakdown).map(([name, value]) => ({
      name,
      value,
      color: name === 'Ride' ? '#FF8000' : name === 'Parcel' ? '#192A4D' : '#00CC00'
    }))

    const onlineDrivers = drivers?.filter(d => d.status === 'Online').length || 0
    const utilization = drivers && drivers.length > 0 ? (onlineDrivers / drivers.length) * 100 : 0

    return {
      efficiency: efficiency.toFixed(1),
      carbon: carbon.toFixed(1),
      utilization: utilization.toFixed(0),
      pieData: pieData.length > 0 ? pieData : [{ name: 'Standby', value: 1, color: '#192A4D' }]
    }
  }, [rides, drivers])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Strategic Intelligence</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Deep data auditing and resource optimization telemetry</p>
        </div>
        <div className="flex gap-2">
           <Badge className="bg-orange/20 text-orange border-orange/40 font-mono text-[10px] px-4 py-1">Q3 REPORTING PHASE</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FuelAnalytics />
        
        <Card className="glass-panel border-none shadow-2xl">
          <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
            <CardTitle className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2 text-white/60">
              <PieChart className="w-4 h-4 text-orange" />
              Operational Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131518', border: '1px solid #192A4D', fontSize: '10px', borderRadius: '8px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 ml-4">
                 {stats.pieData.map((item: any) => (
                   <div key={item.name} className="flex items-center gap-2 text-[10px] uppercase font-black">
                     <span className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: item.color }} />
                     <span className="text-white/40">{item.name}:</span>
                     <span className="text-white">{item.value > 1 ? `₹${item.value}` : '0%'}</span>
                   </div>
                 ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-l-4 border-active p-6">
          <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Efficiency Rating</p>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-black font-mono text-white">{stats.efficiency}</h4>
            <span className="text-[10px] text-active font-black uppercase pb-1">% OPTIMAL</span>
          </div>
          <p className="text-[8px] text-white/20 mt-2 font-bold uppercase">Live calculation based on mission success rate</p>
        </Card>

        <Card className="glass-panel border-l-4 border-orange p-6">
          <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Carbon Footprint</p>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-black font-mono text-orange">{stats.carbon}t</h4>
            <span className="text-[10px] text-emergency font-black uppercase pb-1">+0.4% DRIFT</span>
          </div>
          <p className="text-[8px] text-white/20 mt-2 font-bold uppercase">Estimated CO2 output based on fleet distance</p>
        </Card>

        <Card className="glass-panel border-l-4 border-navy p-6">
          <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Resource Utilization</p>
          <div className="flex items-end gap-2">
            <h4 className="text-4xl font-black font-mono text-white">{stats.utilization}%</h4>
            <span className="text-[10px] text-active font-black uppercase pb-1">NOMINAL</span>
          </div>
          <p className="text-[8px] text-white/20 mt-2 font-bold uppercase">Current fleet availability vs deployment</p>
        </Card>
      </div>
    </div>
  )
}
