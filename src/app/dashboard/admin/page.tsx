
"use client"

import React, { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import LiveMap from "@/components/dashboard/LiveMap"
import FleetStats from "@/components/dashboard/FleetStats"
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
  Bell,
  Search,
  Filter,
  ShieldCheck,
  Star,
  Timer,
  ShieldAlert,
  ArrowRight
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminOperationsCenter() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState('live')

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  // Normalize role string for check
  const role = (profile?.role || "").toLowerCase().replace(/\s+/g, '-')
  const isUserAdmin = role === "admin" || role === "super-admin"

  // LIVE DATA SUBSCRIPTIONS (Operational Focus) - ONLY IF ADMIN
  const ridesQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(20)) : null, [db, isUserAdmin])
  const { data: recentRides } = useCollection(ridesQuery)

  const activeRidesQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "rides"), where("status", "in", ["Accepted", "Arrived", "InProgress"])) : null, [db, isUserAdmin])
  const { data: activeMissions } = useCollection(activeRidesQuery)

  const driversQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "userProfiles"), where("role", "==", "driver")) : null, [db, isUserAdmin])
  const { data: allDrivers } = useCollection(driversQuery)

  const locationsQuery = useMemoFirebase(() => (db && isUserAdmin) ? collection(db, "driverLocations") : null, [db, isUserAdmin])
  const { data: liveLocations } = useCollection(locationsQuery)

  const shiftsQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "driverShifts"), orderBy("punchInTime", "desc"), limit(10)) : null, [db, isUserAdmin])
  const { data: recentShifts } = useCollection(shiftsQuery)

  const profileRequestsQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "profileUpdateRequests"), where("status", "in", ["pending", "submitted"]), limit(5)) : null, [db, isUserAdmin])
  const { data: pendingRequests } = useCollection(profileRequestsQuery)

  useEffect(() => {
    if (isUserAdmin) {
      gsap.from(".admin-card", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" })
    }
  }, [isUserAdmin])

  const statsSummary = useMemo(() => {
    const onlineDrivers = allDrivers?.filter(d => d.status === "Online").length || 0
    const activeTrips = activeMissions?.length || 0
    const revenue = recentRides?.filter(r => r.status === "Paid").reduce((acc, r) => acc + (Number(r.fare) || 0), 0) || 0
    
    // Derived Safety Score
    const ratedDrivers = allDrivers?.filter(d => (d.rating || 0) > 0) || []
    const avgRating = ratedDrivers.length > 0 
      ? (ratedDrivers.reduce((acc, d) => acc + d.rating, 0) / ratedDrivers.length).toFixed(2)
      : "NEW"

    return {
      onlineDrivers,
      activeTrips,
      revenue,
      avgRating,
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
      {/* OPERATIONS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
            Operations Command Node
            <Shield className="w-6 h-6 text-orange animate-pulse" />
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-[10px] text-white/60 uppercase font-bold tracking-[0.3em]">Sector Monitoring Active</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-active animate-pulse" />
              <span className="text-[10px] font-black text-active uppercase">Live Stream</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right border-l border-white/10 pl-4">
            <p className="text-[10px] font-black text-white/40 uppercase">Access Role</p>
            <p className="text-xs font-black text-orange uppercase tracking-widest">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Deployments", value: statsSummary.activeTrips.toString(), trend: "Live", icon: Zap, color: "text-active" },
          { label: "Safety Compliance", value: "99.2%", trend: "Optimal", icon: ShieldCheck, color: "text-active" },
          { label: "Operator Avg Rating", value: statsSummary.avgRating.toString(), trend: "Stable", icon: Star, color: "text-orange" },
          { label: "Active Drivers", value: statsSummary.onlineDrivers.toString(), trend: "Sync", icon: Users, color: "text-white" },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel admin-card p-6 bg-navy/20 border-none relative overflow-hidden group">
            <stat.icon className="absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity text-white" />
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">{stat.label}</p>
            <h4 className={cn("text-2xl font-black font-mono", stat.color)}>{stat.value}</h4>
            <Badge variant="outline" className="mt-2 text-[8px] border-white/10 text-white/40 font-black">{stat.trend}</Badge>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* TACTICAL MAP CONTAINER */}
        <div className="xl:col-span-3 min-h-[600px] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative bg-card/20">
          <LiveMap 
            locations={liveLocations} 
            activeRides={activeMissions} 
          />
          <div className="absolute top-4 left-4 z-[1000] flex gap-2">
            <button 
              className="px-4 py-2 text-[10px] font-black uppercase rounded-lg border bg-orange border-orange text-white transition-all backdrop-blur-md"
            >
              <Signal className="w-3 h-3 mr-2 inline" /> Live Tactical Feed
            </button>
          </div>
        </div>

        {/* SIDE PANELS (Operations Focus) */}
        <div className="space-y-6">
          <Card className="glass-panel admin-card border-l-4 border-emergency">
            <CardHeader className="p-4 bg-emergency/5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-emergency animate-pulse" />
                <CardTitle className="text-[10px] font-black uppercase text-emergency">Critical Exceptions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
              <AnimatePresence>
                {recentRides?.filter(r => r.status === "Cancelled" || r.status === "Rejected").slice(0, 5).map(alert => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={alert.id} 
                    className="p-3 bg-emergency/10 rounded border border-emergency/20"
                  >
                    <p className="text-[10px] font-bold uppercase text-white">Status Breach: {alert.id.substring(0,6)}</p>
                    <p className="text-[8px] text-white/60 mt-1 uppercase">Unit Rejected Broadcast at Sector {Math.floor(Math.random() * 20)}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="glass-panel admin-card border-l-4 border-orange">
            <CardHeader className="p-4 bg-orange/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange" />
                <CardTitle className="text-[10px] font-black uppercase text-orange">Profile Auth Requests</CardTitle>
              </div>
              <Link href="/dashboard/admin/profile-requests">
                <Button variant="ghost" className="h-6 px-2 text-[8px] uppercase font-black text-orange hover:bg-orange/10">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingRequests?.length === 0 ? (
                <p className="text-[10px] text-white/20 uppercase font-black text-center py-4">No Pending Actions</p>
              ) : (
                pendingRequests?.map(req => (
                  <div key={req.id} className="p-3 bg-white/5 rounded border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-white">{req.userName}</p>
                      <p className="text-[8px] text-orange uppercase font-bold">{req.status === 'pending' ? 'Auth Request' : 'Review Required'}</p>
                    </div>
                    <Link href="/dashboard/admin/profile-requests">
                       <ArrowRight className="w-4 h-4 text-orange" />
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel admin-card flex-1 flex flex-col">
            <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange" />
                <CardTitle className="text-[10px] font-black uppercase text-white">Live Shift Pulse</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-white/5">
                {recentShifts?.map(shift => (
                  <div key={shift.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center transition-colors",
                        shift.status === 'Active' ? "bg-active/10 text-active" : "bg-white/5 text-white/20"
                      )}>
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white">Operator: {shift.driverId.substring(0,8)}</p>
                        <p className="text-[8px] text-white/40 uppercase font-mono">{shift.status} • {shift.shiftDate}</p>
                      </div>
                    </div>
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
