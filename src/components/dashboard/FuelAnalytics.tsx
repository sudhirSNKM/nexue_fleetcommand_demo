
"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

export default function FuelAnalytics() {
  const db = useFirestore()
  const ridesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(100)) : null, [db])
  const { data: rides } = useCollection(ridesQuery)

  const chartData = useMemo(() => {
    if (!rides) return []
    const groups: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString('en-US', { weekday: 'short' })
      groups[key] = 0
    }

    rides.forEach(r => {
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : null)
      if (d) {
        const key = d.toLocaleDateString('en-US', { weekday: 'short' })
        if (groups[key] !== undefined) {
          groups[key] += Number(r.fare) / 10 // Using fare as a proxy for tactical load/activity
        }
      }
    })

    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [rides])

  return (
    <Card className="glass-panel border-none shadow-2xl h-full flex flex-col bg-navy/20">
      <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
        <CardTitle className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2 text-white/60">
          Tactical Deployment Load
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8000" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF8000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#ffffff20" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#ffffff20" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}U`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131518', border: '1px solid #192A4D', fontSize: '10px', borderRadius: '8px' }}
                itemStyle={{ color: '#FF8000' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#FF8000" 
                fillOpacity={1} 
                fill="url(#colorFuel)" 
                strokeWidth={3}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
