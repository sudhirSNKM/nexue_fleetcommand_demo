
"use client"

import React, { useMemo, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Plus,
  AlertTriangle,
  Bell,
  Navigation,
  Signal,
  Truck,
  Package,
  Car
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import FleetStats from "@/components/dashboard/FleetStats"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import LiveMap from "@/components/dashboard/LiveMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function SuperAdminDashboard() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState('live')

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const isSuperAdmin = profile?.role === "super-admin"

  // Platform Metrics Queries (Live Listeners)
  const driversQuery = useMemoFirebase(() => db ? query(collection(db, "userProfiles"), where("role", "==", "driver")) : null, [db])
  const { data: allDrivers } = useCollection(driversQuery)

  const ridesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(50)) : null, [db])
  const { data: rides } = useCollection(ridesQuery)

  const activeRidesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), where("status", "in", ["Requested", "Accepted", "Arrived", "InProgress"])) : null, [db])
  const { data: activeMissions } = useCollection(activeRidesQuery)

  const locationsQuery = useMemoFirebase(() => db ? collection(db, "driverLocations") : null, [db])
  const { data: liveLocations } = useCollection(locationsQuery)

  const stats = useMemo(() => {
    const revenueToday = rides?.filter(r => r.status === "Paid").reduce((acc, r) => acc + (r.fare || 0), 0) || 0
    const onlineCount = allDrivers?.filter(d => d.status === "Online").length || 0
    return {
      revenueToday,
      activeMissions: activeMissions?.length || 0,
      onlineDrivers: onlineCount,
      totalDrivers: allDrivers?.length || 0
    }
  }, [rides, allDrivers, activeMissions])

  if (!isSuperAdmin) {
    return (
      <div className="h-full flex items-center justify-center bg-charcoal">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
          <p className="text-[10px] text-white uppercase font-black tracking-[0.3em] animate-pulse">
            Validating Command Clearance...
          </p>
        </div>
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

      <FleetStats revenue={stats.revenueToday} onlineDrivers={stats.onlineDrivers} activeTrips={stats.activeMissions} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* TACTICAL MAP CONTAINER */}
        <div className="xl:col-span-3 min-h-[600px] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative bg-card/20 group">
          <LiveMap 
            locations={liveLocations} 
            activeRides={activeMissions} 
          />
          <div className="absolute top-4 left-4 z-[1000] flex gap-2">
            <button 
              className="px-4 py-2 text-[10px] font-black uppercase rounded-lg border bg-orange border-orange text-white transition-all backdrop-blur-md shadow-lg"
            >
              <Signal className="w-3 h-3 mr-2 inline" /> Live Tactical Feed
            </button>
          </div>
          
          {/* MAP OVERLAY STATS */}
          <div className="absolute bottom-4 right-4 z-[1000] space-y-2 pointer-events-none group-hover:opacity-100 transition-opacity">
            <div className="bg-charcoal/90 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl">
              <p className="text-[9px] font-black text-white/40 uppercase mb-2">Network Load</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-lg font-black text-white font-mono">{stats.onlineDrivers}</p>
                  <p className="text-[8px] font-bold text-active uppercase">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-white font-mono">{stats.activeMissions}</p>
                  <p className="text-[8px] font-bold text-orange uppercase">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE PANELS: ALERTS & FEED */}
        <div className="space-y-6">
          <Card className="glass-panel border-l-4 border-emergency h-1/2 flex flex-col">
            <CardHeader className="p-4 bg-emergency/5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-emergency animate-pulse" />
                <CardTitle className="text-[10px] font-black uppercase text-emergency">Critical Exceptions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 overflow-y-auto scrollbar-hide">
              <AnimatePresence>
                {rides?.filter(r => r.status === "Cancelled" || r.status === "Rejected").slice(0, 5).map(alert => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={alert.id} 
                    className="p-3 bg-emergency/10 rounded border border-emergency/20"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold uppercase text-white">Status Breach: {alert.id.substring(0,6)}</p>
                      <Badge variant="outline" className="text-[8px] border-emergency/50 text-emergency">CRITICAL</Badge>
                    </div>
                    <p className="text-[8px] text-white/60 mt-1 uppercase">Unit Declined Mission Broadcast at Sector {Math.floor(Math.random() * 20)}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!rides?.some(r => r.status === "Cancelled" || r.status === "Rejected") && (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Shield className="w-8 h-8 mb-2" />
                  <p className="text-[8px] font-black uppercase">No Active Threats</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel h-1/2 flex flex-col">
            <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange" />
                <CardTitle className="text-[10px] font-black uppercase text-white">Live Activity Feed</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-white/5">
                {rides?.slice(0, 10).map(ride => (
                  <div key={ride.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center transition-colors",
                        ride.status === 'Paid' ? "bg-active/10 text-active" : "bg-orange/10 text-orange"
                      )}>
                        {ride.status === 'Paid' ? <Zap className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white">
                          {ride.status === 'Paid' ? 'Settlement Logged' : 'Mission Dispatched'}
                        </p>
                        <p className="text-[8px] text-white/40 uppercase font-mono">{ride.vehicleType} • {ride.id.substring(0,8)}</p>
                      </div>
                    </div>
                    <span className="text-[8px] text-white/20 font-mono">{new Date(ride.createdAt?.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Configuration */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-panel border-l-4 border-orange">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-white">
                <Zap className="w-5 h-5 text-orange" /> Dynamic Pricing Protocol
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
                <Cpu className="w-5 h-5 text-active" /> Infrastructure Health
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
                    <div className={cn("p-2 rounded bg-white/5", node.color)}>
                      <node.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white">{node.label}</p>
                      <p className="text-[9px] text-white/40 uppercase">Cluster: Nexus-Prime-0{i+1}</p>
                    </div>
                  </div>
                  <span className={cn("font-mono text-[10px] font-black", node.color)}>{node.val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-active">
            <CardHeader className="bg-active/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-active">
                <DollarSign className="w-5 h-5" /> Revenue Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-white/40">Daily Target</span>
                  <span className="text-[10px] font-black text-white">₹1,50,000 / ₹2,00,000</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    className="h-full bg-active shadow-[0_0_10px_#00CC00]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="text-center">
                     <p className="text-[8px] font-black text-white/20 uppercase mb-1">Avg Ticket</p>
                     <p className="text-xs font-black text-white">₹422.00</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[8px] font-black text-white/20 uppercase mb-1">Conversion</p>
                     <p className="text-xs font-black text-white">92.4%</p>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
