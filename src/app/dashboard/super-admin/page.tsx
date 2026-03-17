
"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Globe, 
  Shield, 
  Cpu, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Zap,
  Server,
  Database,
  Lock,
  Plus
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import FleetStats from "@/components/dashboard/FleetStats"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"

export default function SuperAdminDashboard() {
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const isSuperAdmin = profile?.role === "Super Admin"

  // Platform Metrics Queries
  const driversQuery = useMemoFirebase(() => db ? query(collection(db, "userProfiles"), where("role", "==", "Driver")) : null, [db])
  const { data: allDrivers } = useCollection(driversQuery)

  const ridesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(50)) : null, [db])
  const { data: rides } = useCollection(ridesQuery)

  const stats = useMemo(() => {
    const revenue = rides?.filter(r => r.status === "Paid").reduce((acc, r) => acc + (r.fare || 0), 0) || 0
    return {
      totalRevenue: revenue,
      activeDrivers: allDrivers?.filter(d => d.status === "Online").length || 0,
      totalDrivers: allDrivers?.length || 0
    }
  }, [rides, allDrivers])

  if (!isSuperAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white text-xs font-black uppercase tracking-widest">Access Denied: Super Admin Clearance Required</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 text-white">
            System Owner Terminal
            <Globe className="w-8 h-8 text-orange animate-spin-slow" />
          </h1>
          <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.4em] mt-2">Global Infrastructure Control Matrix</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-orange/20 bg-orange/5 text-orange font-black uppercase text-[10px] tracking-widest h-12">
            <Plus className="w-4 h-4 mr-2" /> Add Service Zone
          </Button>
          <Button className="bg-orange text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-[0_0_20px_rgba(255,128,0,0.3)]">
            <Shield className="w-4 h-4 mr-2" /> Platform Settings
          </Button>
        </div>
      </div>

      <FleetStats revenue={stats.totalRevenue} onlineDrivers={stats.activeDrivers} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Configuration */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-panel border-l-4 border-orange">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-white">
                <Zap className="w-5 h-5 text-orange" /> Dynamic Pricing Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Base Multiplier", val: "1.2x", status: "Active" },
                  { label: "Surge Threshold", val: "85%", status: "Nominal" },
                  { label: "Platform Fee", val: "15%", status: "Locked" }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">{item.label}</p>
                    <p className="text-2xl font-black font-mono text-white">{item.val}</p>
                    <Badge variant="outline" className="mt-2 text-[8px] border-orange/30 text-orange uppercase font-black">{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <FuelAnalytics />
        </div>

        {/* Infrastructure & Health */}
        <div className="space-y-8">
          <Card className="glass-panel">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-white">
                <Cpu className="w-5 h-5 text-active" /> Node Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { label: "API Gateway", val: "12ms", icon: Server, color: "text-active" },
                { label: "Firestore Sync", val: "Synchronized", icon: Database, color: "text-active" },
                { label: "Auth Bridge", val: "Secure", icon: Lock, color: "text-active" }
              ].map((node, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded bg-white/5 ${node.color}`}>
                      <node.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white">{node.label}</p>
                      <p className="text-[9px] text-white/40 uppercase">Cluster: Nexus-Prime-0{i+1}</p>
                    </div>
                  </div>
                  <span className={`font-mono text-[10px] font-black ${node.color}`}>{node.val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-emergency">
            <CardHeader className="bg-emergency/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-emergency">
                <Activity className="w-5 h-5 animate-pulse" /> Global Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                 {rides?.slice(0, 5).map(ride => (
                   <div key={ride.id} className="p-4 hover:bg-white/5 transition-colors">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter">Settlement: {ride.id.substring(0,8)}</span>
                        <span className="text-[9px] font-mono text-white/40">{ride.createdAt?.toDate?.()?.toLocaleTimeString()}</span>
                     </div>
                     <p className="text-[9px] uppercase font-bold text-active tracking-widest">+ ₹{ride.fare} Platform Credit</p>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
