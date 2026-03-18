
"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Square, 
  MapPin, 
  CheckCircle2,
  Clock,
  Timer,
  Users,
  Search,
  Filter,
  UserCheck,
  UserX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, where, doc, serverTimestamp, orderBy, limit, addDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function DutyManagementPage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  const isAdmin = profile?.role === "admin" || profile?.role === "super-admin"

  const adminShiftsQuery = useMemoFirebase(() => {
    if (!isAdmin) return null
    return query(collection(db, "driverShifts"), orderBy("punchInTime", "desc"), limit(50))
  }, [db, isAdmin])
  const { data: allShifts, isLoading: shiftsLoading } = useCollection(adminShiftsQuery)

  const driverShiftsQuery = useMemoFirebase(() => {
    if (isAdmin || !user) return null
    return query(collection(db, "driverShifts"), where("driverId", "==", user.uid), where("status", "==", "Active"))
  }, [user, db, isAdmin])
  const { data: driverShifts } = useCollection(driverShiftsQuery)

  const activeShift = driverShifts?.[0]

  useEffect(() => {
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const timeToMidnight = midnight.getTime() - now.getTime()

    const refreshTimer = setTimeout(() => {
      window.location.reload()
    }, timeToMidnight)

    if (!isAdmin && user && db && !activeShift && profile?.status === "Online") {
      const todayDate = new Date().toISOString().split('T')[0]
      const initializeAutoShift = async () => {
        await addDoc(collection(db, "driverShifts"), {
          driverId: user.uid,
          punchInTime: serverTimestamp(),
          status: "Active",
          shiftDate: todayDate
        })
      }
      initializeAutoShift()
    }

    return () => clearTimeout(refreshTimer)
  }, [isAdmin, user, db, activeShift, profile?.status])

  const handleEndShift = (shiftId: string) => {
    const shiftRef = doc(db, "driverShifts", shiftId)
    updateDocumentNonBlocking(shiftRef, {
      status: "Completed",
      punchOutTime: serverTimestamp()
    })
  }

  if (!isAdmin && !user) return null

  if (isAdmin) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Duty Manifest</h1>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Fleet Deployment & Shift Telemetry</p>
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange transition-colors" />
              <input placeholder="Search Operator ID..." className="bg-navy/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange/50 transition-all w-64" />
            </div>
            <Button variant="outline" className="border-white/10 text-white font-black uppercase text-[10px] h-11 px-6 hover:bg-white/5"><Filter className="w-4 h-4 mr-2" /> Filter Active</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Active Units", val: allShifts?.filter(s => s.status === 'Active').length || 0, color: "text-active", icon: UserCheck },
            { label: "Completed Shifts", val: allShifts?.filter(s => s.status === 'Completed').length || 0, color: "text-orange", icon: CheckCircle2 },
            { label: "Avg Shift Duration", val: "8.4h", color: "text-white", icon: Clock },
          ].map((stat, i) => (
            <Card key={i} className="glass-panel border-none p-6 bg-navy/20 relative group overflow-hidden">
               <stat.icon className={cn("absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity", stat.color)} />
               <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">{stat.label}</p>
               <h4 className={cn("text-2xl font-black font-mono", stat.color)}>{stat.val}</h4>
            </Card>
          ))}
        </div>

        <Card className="glass-panel border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-navy/30 text-white/40 uppercase font-black tracking-widest text-[10px]"><th className="p-4 border-r border-white/5">Operator ID</th><th className="p-4 border-r border-white/5">Shift Start</th><th className="p-4 border-r border-white/5">Shift End</th><th className="p-4 border-r border-white/5">Status</th><th className="p-4">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/5 text-white font-bold uppercase text-[10px]">
                {allShifts?.map((shift) => (
                  <tr key={shift.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-orange">{shift.driverId.substring(0, 12)}...</td>
                    <td className="p-4 font-mono text-white/60">{shift.punchInTime?.toDate?.()?.toLocaleString() || "N/A"}</td>
                    <td className="p-4 font-mono text-white/60">{shift.punchOutTime?.toDate?.()?.toLocaleString() || "PENDING"}</td>
                    <td className="p-4"><Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5", shift.status === 'Active' ? "bg-active/10 text-active border-active/20" : "bg-white/5 text-white/40")}>{shift.status}</Badge></td>
                    <td className="p-4">{shift.status === 'Active' && <Button size="sm" onClick={() => handleEndShift(shift.id)} className="bg-emergency/10 border border-emergency/20 text-emergency font-black uppercase text-[8px] h-7 hover:bg-emergency hover:text-white">Manual End</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black uppercase tracking-tighter">Duty Terminal</h1><p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Operator Protocol</p></div>
        {activeShift && <Badge className="bg-active/20 text-active border-active animate-pulse">ON-DUTY</Badge>}
      </div>
      {!activeShift ? (
        <Card className="glass-panel border-dashed border-navy/50 p-12 text-center">
          <div className="w-20 h-20 bg-navy/20 rounded-full flex items-center justify-center mx-auto mb-6"><Play className="w-10 h-10 text-orange" /></div>
          <h2 className="text-xl font-black uppercase mb-2">Initialize Shift</h2>
          <p className="text-sm text-muted-foreground mb-8">System standby. Ready to begin tactical operations.</p>
          <Button onClick={() => addDoc(collection(db, "driverShifts"), { driverId: user?.uid, punchInTime: serverTimestamp(), status: "Active", shiftDate: new Date().toISOString().split('T')[0] })} className="w-full bg-orange hover:bg-orange/90 h-14 font-black uppercase tracking-widest">Punch In to Duty</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="glass-panel border-l-4 border-orange p-12 text-center">
             <Timer className="w-12 h-12 text-orange mx-auto mb-4 animate-pulse" />
             <h2 className="text-xl font-black uppercase">Shift Operational</h2>
             <p className="text-sm text-muted-foreground mb-8">Operator tracking active. Scanning for missions.</p>
             <Button onClick={() => handleEndShift(activeShift.id)} variant="destructive" className="w-full h-14 font-black uppercase">End Full Shift</Button>
          </Card>
        </div>
      )}
    </div>
  )
}
