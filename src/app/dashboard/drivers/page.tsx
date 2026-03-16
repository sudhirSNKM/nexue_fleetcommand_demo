
"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Star, Clock, ShieldCheck, Timer } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function DriversPage() {
  const db = useFirestore()
  
  const driversQuery = useMemoFirebase(() => collection(db, "userProfiles"), [db])
  const { data: drivers } = useCollection(driversQuery)

  const shiftsQuery = useMemoFirebase(() => query(collection(db, "driverShifts"), orderBy("punchInTime", "desc")), [db])
  const { data: shifts } = useCollection(shiftsQuery)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Personnel Directory</h1>
        <p className="text-sm text-muted-foreground font-medium">Certified operator monitoring and tactical performance auditing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {drivers?.filter(d => d.role === 'Driver').map((driver, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-navy/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 ring-2 ring-orange/10">
                        <AvatarImage src={`https://picsum.photos/seed/${driver.id}/100/100`} />
                        <AvatarFallback>{driver.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{driver.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{driver.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-8">
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-muted-foreground uppercase font-black">Cert. Score</p>
                        <div className="flex items-center gap-1 text-orange font-bold text-sm">
                          <Star className="w-3 h-3 fill-orange" />
                          4.8
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-muted-foreground uppercase font-black">Protocol ID</p>
                        <p className="text-sm font-mono font-bold">{driver.id.substring(0, 6).toUpperCase()}</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <Badge variant="outline" className="text-[9px] uppercase font-black border-active text-active">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="glass-panel">
            <CardHeader className="p-4 border-b border-navy/20">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange" />
                Recent Shift Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-navy/20">
                {shifts?.slice(0, 5).map((shift, i) => (
                  <div key={i} className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{shift.shiftDate}</span>
                      <Badge className={shift.status === 'Active' ? 'bg-active/20 text-active' : 'bg-navy/40 text-muted-foreground'}>
                        {shift.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-tight">Driver ID: {shift.driverId.substring(0, 8)}</p>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase text-muted-foreground">
                      <span>IN: {shift.punchInTime?.toDate?.()?.toLocaleTimeString() || "N/A"}</span>
                      {shift.punchOutTime && <span>OUT: {shift.punchOutTime?.toDate?.()?.toLocaleTimeString()}</span>}
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
          { icon: Clock, label: "Total Fleet Hours", value: "1,204h", trend: "Nominal" },
          { icon: ShieldCheck, label: "Safety Compliance", value: "99.2%", trend: "Optimal" },
          { icon: Star, label: "Operator Avg", value: "4.82", trend: "Stable" },
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
