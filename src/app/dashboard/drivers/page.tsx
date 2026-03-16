
"use client"

import React from "react"
import DriverPerformance from "@/components/dashboard/DriverPerformance"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Star, Clock, ShieldCheck } from "lucide-react"

export default function DriversPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter">Personnel Directory</h1>
        <p className="text-sm text-muted-foreground">Certified operator monitoring and safety auditing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DriverPerformance />
        </div>
        
        <div className="lg:col-span-2">
          <Card className="glass-panel h-full">
            <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
              <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-orange" />
                Verified Operators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-navy/20">
                {[
                  { name: "Alex Hunt", role: "Master Pilot", score: 4.9, trips: 1402, status: "Active" },
                  { name: "Sarah K.", role: "Lead Courier", score: 4.7, trips: 892, status: "Active" },
                  { name: "Mike Ross", role: "Operator", score: 4.2, trips: 221, status: "Off-Duty" },
                  { name: "Jane Doe", role: "Logistics Specialist", score: 4.8, trips: 567, status: "Active" },
                  { name: "John Miller", role: "Junior Operator", score: 3.9, trips: 42, status: "In Training" },
                ].map((driver, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-navy/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 ring-2 ring-orange/10">
                        <AvatarImage src={`https://picsum.photos/seed/${driver.name}/100/100`} />
                        <AvatarFallback>{driver.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{driver.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{driver.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-8">
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-muted-foreground uppercase font-black">Score</p>
                        <div className="flex items-center gap-1 text-orange font-bold text-sm">
                          <Star className="w-3 h-3 fill-orange" />
                          {driver.score}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-muted-foreground uppercase font-black">Trips</p>
                        <p className="text-sm font-mono font-bold">{driver.trips}</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <Badge variant="outline" className={`text-[9px] uppercase font-black ${
                          driver.status === 'Active' ? 'border-active text-active' : 
                          driver.status === 'Off-Duty' ? 'border-muted text-muted-foreground' : 
                          'border-orange text-orange'
                        }`}>
                          {driver.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Clock, label: "Avg Shift Time", value: "8h 12m", trend: "Nominal" },
          { icon: ShieldCheck, label: "Safety Incidents", value: "0", trend: "Last 30 Days" },
          { icon: Star, label: "Team Average", value: "4.6", trend: "Stable" },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel border-none p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-navy/20 text-orange">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{stat.label}</p>
                <h4 className="text-2xl font-black font-mono">{stat.value}</h4>
                <p className="text-[9px] text-active font-bold uppercase mt-1">{stat.trend}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
