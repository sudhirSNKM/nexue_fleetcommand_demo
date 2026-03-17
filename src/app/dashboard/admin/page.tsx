
"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import gsap from "gsap"
import LiveMap from "@/components/dashboard/LiveMap"
import FleetStats from "@/components/dashboard/FleetStats"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, AlertTriangle, Users } from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, orderBy, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function AdminCommandCenter() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState('live')

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const isAdmin = profile?.role === "Admin" || profile?.role === "Super Admin"

  // Guard the query to avoid permission errors for non-admin users who haven't been redirected yet
  const ridesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null
    return query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(5))
  }, [db, isAdmin])

  const { data: recentRides } = useCollection(ridesQuery)

  useEffect(() => {
    if (isAdmin) {
      gsap.from(".admin-card", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" })
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] animate-pulse">
          Validating Security Clearance...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            Mobility Command Terminal
            <Shield className="w-6 h-6 text-orange animate-pulse" />
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em]">Operational Overseer Mode Active</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-muted-foreground uppercase">Clearance</p>
          <p className="text-xs font-black text-orange uppercase tracking-widest">{profile?.role}</p>
        </div>
      </div>

      <FleetStats />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 min-h-[500px] border border-navy rounded-2xl overflow-hidden shadow-2xl relative">
          <LiveMap />
          <div className="absolute top-4 left-4 z-[1000] flex gap-2">
            <button 
              onClick={() => setActiveTab('live')} 
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase rounded-lg border transition-all", 
                activeTab === 'live' ? "bg-orange border-orange" : "bg-charcoal/80 border-navy"
              )}
            >
              Live Tracking
            </button>
            <button 
              onClick={() => setActiveTab('heatmap')} 
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase rounded-lg border transition-all", 
                activeTab === 'heatmap' ? "bg-orange border-orange" : "bg-charcoal/80 border-navy"
              )}
            >
              Demand Heatmap
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel admin-card border-l-4 border-emergency">
            <CardHeader className="p-4 bg-emergency/5 border-b border-white/5 flex flex-row items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emergency animate-pulse" />
              <CardTitle className="text-[10px] font-black uppercase text-emergency">Critical Exceptions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-2 bg-emergency/10 rounded border border-emergency/20">
                  <p className="text-[10px] font-bold uppercase">Asset NX-8822 Off-Route</p>
                  <p className="text-[8px] text-muted-foreground">Sector 9 Deviation detected</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel admin-card">
            <CardHeader className="p-4 bg-navy/10 border-b border-white/5 flex flex-row items-center gap-2">
              <Zap className="w-4 h-4 text-orange" />
              <CardTitle className="text-[10px] font-black uppercase">Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {recentRides?.map(ride => (
                  <div key={ride.id} className="p-3 hover:bg-navy/10 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase">{ride.vehicleType}</p>
                      <p className="text-[8px] text-muted-foreground truncate w-32">{ride.pickup.address}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-orange/50 text-orange">{ride.status}</Badge>
                  </div>
                ))}
                {!recentRides?.length && (
                  <div className="p-8 text-center opacity-20">
                    <Zap className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase">No active missions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FuelAnalytics />
        <Card className="glass-panel admin-card">
           <CardHeader className="p-4 border-b border-white/5">
             <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
               <Users className="w-4 h-4 text-active" /> Operator Compliance
             </CardTitle>
           </CardHeader>
           <CardContent className="p-4">
              <div className="space-y-4">
                {[
                  { label: "Active Drivers", val: 88, color: "bg-active" },
                  { label: "Pending Approval", val: 12, color: "bg-orange" },
                  { label: "Maintenance Required", val: 5, color: "bg-emergency" }
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                      <span>{stat.label}</span>
                      <span>{stat.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-navy/30 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${stat.val}%` }} className={`h-full ${stat.color}`} />
                    </div>
                  </div>
                ))}
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
