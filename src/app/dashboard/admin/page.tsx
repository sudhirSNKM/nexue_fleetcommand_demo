
"use client"

import React, { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import LiveMap from "@/components/dashboard/LiveMap"
import FleetStats from "@/components/dashboard/FleetStats"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  Users, 
  Activity, 
  Signal, 
  Clock, 
  TrendingUp, 
  Map as MapIcon,
  Bell
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function AdminCommandCenter() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState('live')

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const isUserAdmin = profile?.role === "Admin" || profile?.role === "Super Admin"

  // LIVE DATA SUBSCRIPTIONS
  const ridesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(10)) : null, [db])
  const { data: recentRides } = useCollection(ridesQuery)

  const activeRidesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), where("status", "in", ["Accepted", "Arrived", "InProgress"])) : null, [db])
  const { data: activeMissions } = useCollection(activeRidesQuery)

  const driversQuery = useMemoFirebase(() => db ? query(collection(db, "userProfiles"), where("role", "==", "Driver")) : null, [db])
  const { data: allDrivers } = useCollection(driversQuery)

  const locationsQuery = useMemoFirebase(() => db ? collection(db, "driverLocations") : null, [db])
  const { data: liveLocations } = useCollection(locationsQuery)

  useEffect(() => {
    if (isUserAdmin) {
      gsap.from(".admin-card", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" })
    }
  }, [isUserAdmin])

  const statsSummary = useMemo(() => {
    const onlineDrivers = allDrivers?.filter(d => d.status === "Online").length || 0
    const activeTrips = activeMissions?.length || 0
    const revenue = recentRides?.filter(r => r.status === "Paid").reduce((acc, r) => acc + (r.fare || 0), 0) || 0
    
    return {
      onlineDrivers,
      activeTrips,
      revenue,
      fleetSize: allDrivers?.length || 0
    }
  }, [allDrivers, activeMissions, recentRides])

  if (!isUserAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-charcoal">
        <div className="w-12 h-12 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
        <p className="text-[10px] text-white uppercase font-black tracking-[0.3em] animate-pulse">
          Validating Security Clearance...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
            Mobility Command Terminal
            <Shield className="w-6 h-6 text-orange animate-pulse" />
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-[10px] text-white/60 uppercase font-bold tracking-[0.3em]">Operational Overseer Mode Active</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-active animate-pulse" />
              <span className="text-[10px] font-black text-active uppercase">Core Linked</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right border-r border-white/10 pr-4">
            <p className="text-[10px] font-black text-white/40 uppercase">System Uptime</p>
            <p className="text-sm font-mono font-bold text-white tracking-tighter">99.98%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/40 uppercase">Access Role</p>
            <p className="text-xs font-black text-orange uppercase tracking-widest">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <FleetStats 
        activeTrips={statsSummary.activeTrips} 
        onlineDrivers={statsSummary.onlineDrivers}
        revenue={statsSummary.revenue}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* TACTICAL MAP CONTAINER */}
        <div className="xl:col-span-3 min-h-[600px] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative bg-card/20">
          <LiveMap 
            locations={liveLocations} 
            activeRides={activeMissions} 
          />
          <div className="absolute top-4 left-4 z-[1000] flex gap-2">
            <button 
              onClick={() => setActiveTab('live')} 
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase rounded-lg border transition-all backdrop-blur-md", 
                activeTab === 'live' ? "bg-orange border-orange text-white" : "bg-charcoal/80 border-white/10 text-white/70 hover:bg-white/5"
              )}
            >
              <Signal className="w-3 h-3 mr-2 inline" /> Live Tracking
            </button>
            <button 
              onClick={() => setActiveTab('heatmap')} 
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase rounded-lg border transition-all backdrop-blur-md", 
                activeTab === 'heatmap' ? "bg-orange border-orange text-white" : "bg-charcoal/80 border-white/10 text-white/70 hover:bg-white/5"
              )}
            >
              <TrendingUp className="w-3 h-3 mr-2 inline" /> Demand Heatmap
            </button>
          </div>
          
          {/* MAP OVERLAY STATS */}
          <div className="absolute bottom-4 right-4 z-[1000] space-y-2 pointer-events-none">
            <div className="bg-charcoal/90 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl">
              <p className="text-[9px] font-black text-white/40 uppercase mb-2">Live Fleet Distribution</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-lg font-black text-white font-mono">{statsSummary.onlineDrivers}</p>
                  <p className="text-[8px] font-bold text-active uppercase">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-white font-mono">{statsSummary.activeTrips}</p>
                  <p className="text-[8px] font-bold text-orange uppercase">In Trip</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="space-y-6">
          {/* CRITICAL ALERTS */}
          <Card className="glass-panel admin-card border-l-4 border-emergency">
            <CardHeader className="p-4 bg-emergency/5 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-emergency animate-pulse" />
                <CardTitle className="text-[10px] font-black uppercase text-emergency">Critical Exceptions</CardTitle>
              </div>
              <Badge variant="outline" className="border-emergency/30 text-emergency text-[8px]">LIVE</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <AnimatePresence>
                {recentRides?.filter(r => r.status === "Cancelled").slice(0, 2).map(alert => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={alert.id} 
                    className="p-3 bg-emergency/10 rounded border border-emergency/20"
                  >
                    <p className="text-[10px] font-bold uppercase text-white">Mission Failure ID: {alert.id.substring(0,6)}</p>
                    <p className="text-[8px] text-white/60 mt-1 uppercase">Timeout / No Response at Sector {Math.floor(Math.random() * 20)}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!recentRides?.some(r => r.status === "Cancelled") && (
                <div className="py-4 text-center opacity-30">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-[8px] font-black uppercase">No Critical Violations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LIVE ACTIVITY FEED */}
          <Card className="glass-panel admin-card flex-1 flex flex-col">
            <CardHeader className="p-4 bg-navy/10 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange" />
                <CardTitle className="text-[10px] font-black uppercase text-white">Live Feed</CardTitle>
              </div>
              <Activity className="w-3 h-3 text-active animate-pulse" />
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-white/5">
                {recentRides?.map(ride => (
                  <div key={ride.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center transition-colors",
                        ride.status === 'Paid' ? "bg-active/10 text-active" : "bg-orange/10 text-orange"
                      )}>
                        {ride.status === 'Paid' ? <Zap className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white">
                          {ride.status === 'Paid' ? 'Settlement Confirmed' : 'Mission Deployed'}
                        </p>
                        <p className="text-[8px] text-white/40 uppercase font-mono">{ride.vehicleType} • {ride.id.substring(0,8)}</p>
                      </div>
                    </div>
                    <p className="text-[9px] font-black text-white/20 group-hover:text-white/40 transition-colors">
                      {ride.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'JUST NOW'}
                    </p>
                  </div>
                ))}
                {!recentRides?.length && (
                  <div className="p-12 text-center opacity-20">
                    <Signal className="w-12 h-12 mx-auto mb-4 text-white" />
                    <p className="text-[10px] font-black uppercase text-white">Connecting to Feed...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <FuelAnalytics />
        
        <Card className="glass-panel admin-card">
           <CardHeader className="p-4 border-b border-white/5">
             <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-white">
               <Users className="w-4 h-4 text-active" /> Operator Compliance
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
              <div className="space-y-6">
                {[
                  { label: "Network Capacity", val: Math.min(100, (statsSummary.onlineDrivers / (statsSummary.fleetSize || 1)) * 100), color: "bg-active" },
                  { label: "Trip Efficiency", val: 94, color: "bg-orange" },
                  { label: "SLA Adherence", val: 98, color: "bg-active" }
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-white/80">
                      <span>{stat.label}</span>
                      <span className="font-mono">{stat.val.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${stat.val}%` }} 
                        className={`h-full ${stat.color} shadow-[0_0_10px_rgba(255,128,0,0.3)]`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
           </CardContent>
        </Card>

        <Card className="glass-panel admin-card">
          <CardHeader className="p-4 border-b border-white/5">
             <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-white">
               <Activity className="w-4 h-4 text-orange" /> System Health
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[8px] font-black uppercase text-white/40 mb-1">Latency</p>
                  <p className="text-xl font-black font-mono text-active">14ms</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[8px] font-black uppercase text-white/40 mb-1">Db Queries</p>
                  <p className="text-xl font-black font-mono text-white">2.4k/s</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center col-span-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase text-white/40">API Status</p>
                    <Badge className="bg-active/20 text-active border-active/40 text-[8px]">NOMINAL</Badge>
                  </div>
                </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
