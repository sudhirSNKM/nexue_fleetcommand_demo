
"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, Fuel, Timer, Gauge, Zap, Users, Signal } from "lucide-react"

interface FleetStatsProps {
  activeTrips?: number;
  onlineDrivers?: number;
  revenue?: number;
}

export default function FleetStats({ activeTrips = 0, onlineDrivers = 0, revenue = 0 }: FleetStatsProps) {
  const stats = [
    { 
      label: "Active Deployments", 
      value: activeTrips.toString(), 
      trend: "+12%", 
      icon: Zap, 
      color: "text-active",
      barColor: "bg-active"
    },
    { 
      label: "Unit Availability", 
      value: onlineDrivers.toString(), 
      trend: "Optimal", 
      icon: Users, 
      color: "text-orange",
      barColor: "bg-orange"
    },
    { 
      label: "Daily Credits", 
      value: `₹${revenue.toLocaleString()}`, 
      trend: "Peak", 
      icon: Gauge, 
      color: "text-white",
      barColor: "bg-white"
    },
    { 
      label: "Network Health", 
      value: "99%", 
      trend: "Stable", 
      icon: Signal, 
      color: "text-active",
      barColor: "bg-active"
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="glass-panel border-none overflow-hidden relative group bg-card/40 backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-white/5 border border-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trend.includes('-') ? 'text-emergency' : 'text-active'}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-black font-mono tracking-tighter text-white">{stat.value}</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "70%" }}
                   className={`h-full ${stat.barColor} shadow-[0_0_8px_currentColor]`}
                 />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
