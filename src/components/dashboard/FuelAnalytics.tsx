
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
]

export default function FuelAnalytics() {
  return (
    <Card className="glass-panel h-full flex flex-col">
      <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
        <CardTitle className="text-sm font-bold tracking-widest uppercase">Fuel Consumption Dynamics</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8000" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF8000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#192A4D" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}L`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131518', border: '1px solid #192A4D', fontSize: '12px' }}
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
