
"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  Navigation, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Zap, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function TripsManagementPage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  const isUserAdmin = profile?.role === "admin" || profile?.role === "super-admin"

  const ridesQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(
    collection(db, "rides"), 
    orderBy("createdAt", "desc"),
    limit(50)
  ) : null, [db, isUserAdmin])

  const { data: rides, isLoading } = useCollection(ridesQuery)

  if (!isUserAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-charcoal text-white">
        <div className="w-10 h-10 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
        <p className="text-[10px] uppercase font-black tracking-widest">Validating Clearance...</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Paid':
        return <CheckCircle2 className="w-4 h-4 text-active" />
      case 'Cancelled':
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-emergency" />
      case 'InProgress':
        return <Zap className="w-4 h-4 text-orange animate-pulse" />
      default:
        return <Clock className="w-4 h-4 text-white/40" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Mission Manifest</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Global Deployment Audit Trail</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange transition-colors" />
            <input 
              placeholder="Search Mission ID..." 
              className="bg-navy/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange/50 transition-all w-64"
            />
          </div>
          <Button variant="outline" className="border-white/10 text-white font-black uppercase text-[10px] h-11 px-6 hover:bg-white/5">
            <Filter className="w-4 h-4 mr-2" /> Sector Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Missions", val: rides?.filter(r => ['Accepted', 'Arrived', 'InProgress'].includes(r.status)).length || 0, color: "text-orange" },
          { label: "Total Completed", val: rides?.filter(r => r.status === 'Paid').length || 0, color: "text-active" },
          { label: "Critical Failures", val: rides?.filter(r => r.status === 'Cancelled').length || 0, color: "text-emergency" },
          { label: "Global Efficiency", val: "94.2%", color: "text-white" },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel border-none p-6 bg-navy/20 relative overflow-hidden">
             <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">{stat.label}</p>
             <h4 className={cn("text-2xl font-black font-mono", stat.color)}>{stat.val}</h4>
             <div className={cn("absolute bottom-0 left-0 h-1 w-full bg-current opacity-20", stat.color)} />
          </Card>
        ))}
      </div>

      <Card className="glass-panel border-none shadow-2xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy/30 text-white/40 uppercase font-black tracking-widest text-[10px]">
                <th className="p-4 border-r border-white/5">Mission ID</th>
                <th className="p-4 border-r border-white/5">Passenger/Unit</th>
                <th className="p-4 border-r border-white/5">Tactical Vector</th>
                <th className="p-4 border-r border-white/5">Credits</th>
                <th className="p-4 border-r border-white/5">Protocol Status</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white font-bold uppercase text-[10px]">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-4"><div className="h-4 bg-white/5 rounded w-full" /></td>
                  </tr>
                ))
              ) : rides?.map((ride) => (
                <tr key={ride.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-4 font-mono tracking-tighter text-white/40">{ride.id.substring(0, 8)}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-black">{ride.passengerId.substring(0, 6)}</span>
                      <span className="text-orange text-[8px] font-black">{ride.vehicleType} UNIT</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-active" />
                      <span className="truncate text-white/80">{ride.pickup?.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3 h-3 text-orange" />
                      <span className="truncate text-white/40">{ride.dropoff?.address}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-white text-sm">₹{ride.fare}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ride.status)}
                      <Badge className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5",
                        ride.status === 'Paid' || ride.status === 'Completed' ? "bg-active/10 text-active" : 
                        ride.status === 'Cancelled' || ride.status === 'Rejected' ? "bg-emergency/10 text-emergency" : 
                        "bg-orange/10 text-orange"
                      )}>
                        {ride.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4 text-white/30 text-[9px]">{new Date(ride.createdAt?.seconds * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
