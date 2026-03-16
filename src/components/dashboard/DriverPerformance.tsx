
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"

const data = [
  { name: 'Alex H.', score: 98 },
  { name: 'Sarah K.', score: 85 },
  { name: 'Mike R.', score: 72 },
  { name: 'Jane S.', score: 91 },
  { name: 'John D.', score: 64 },
]

export default function DriverPerformance() {
  return (
    <Card className="glass-panel h-full flex flex-col">
      <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
        <CardTitle className="text-sm font-bold tracking-widest uppercase">Top Safety Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748b" 
                fontSize={10} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(25, 42, 77, 0.2)' }}
                contentStyle={{ backgroundColor: '#131518', border: '1px solid #192A4D', fontSize: '12px' }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.score > 90 ? '#00CC00' : entry.score > 70 ? '#FFFF00' : '#FF0000'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
