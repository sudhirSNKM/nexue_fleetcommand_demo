
"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, Fuel, Timer, Gauge } from "lucide-react"

const stats = [
  { label: "Active Fleet", value: "128", trend: "+4%", icon: Truck, color: "text-active" },
  { label: "Fuel Level", value: "84%", trend: "Optimal", icon: Fuel, color: "text-orange" },
  { label: "Total Mileage", value: "14,202", trend: "7.2k today", icon: Timer, color: "text-white" },
  { label: "Avg Speed", value: "42 mph", trend: "-2%", icon: Gauge, color: "text-idle" },
]

export default function FleetStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="glass-panel border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-navy/30 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${stat.trend.includes('-') ? 'text-emergency' : 'text-active'}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-black font-mono tracking-tighter">{stat.value}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
              <div className="mt-4 h-1 w-full bg-navy/20 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "70%" }}
                   className={`h-full bg-orange shadow-[0_0_8px_rgba(255,128,0,0.5)]`}
                 />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
