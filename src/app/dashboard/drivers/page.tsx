
"use client"

import React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Star, Clock, ShieldCheck, Timer, ChevronRight, Search, Loader2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, where, doc, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function DriversPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)
  
  const role = (profile?.role || "").toLowerCase().replace(/\s+/g, '-')
  const isUserAdmin = role === "admin" || role === "super-admin"
  
  const driversQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "userProfiles"), where("role", "==", "driver")) : null, [db, isUserAdmin])
  const { data: drivers, isLoading: isDriversLoading } = useCollection(driversQuery)

  const shiftsQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(collection(db, "driverShifts"), orderBy("punchInTime", "desc"), limit(50)) : null, [db, isUserAdmin])
  const { data: shifts, isLoading: isShiftsLoading } = useCollection(shiftsQuery)

  if (isProfileLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-charcoal min-h-[400px]">
        <Loader2 className="w-10 h-10 text-orange animate-spin" />
        <p className="text-[10px] text-white uppercase font-black tracking-[0.3em]">Syncing Clearance...</p>
      </div>
    )
  }

  if (!isUserAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-charcoal text-white min-h-[400px]">
        <ShieldCheck className="w-12 h-12 text-emergency mb-2" />
        <h2 className="text-xl font-black uppercase">Access Denied</h2>
        <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Administrative Clearance Level Required</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Personnel Directory</h1>
          <p className="text-sm text-muted-foreground font-medium">Certified operator monitoring and tactical performance auditing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-orange text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-lg shadow-orange/20 border-none">
            <Users className="w-4 h-4 mr-2" /> Provision New Operator
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-panel h-full border-none shadow-2xl">
            <CardHeader className="p-4 bg-navy/20 border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4 text-orange" />
                Verified Operators Manifest
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input 
                  placeholder="Filter by Name/ID..." 
                  className="bg-navy/40 border border-white/5 rounded-md pl-7 pr-3 py-1.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-orange/50 transition-all w-48"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 min-h-[400px]">
              {isDriversLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-orange animate-spin" />
                  <p className="text-[10px] font-black uppercase text-white/20">Accessing Registry...</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {drivers?.map((driver, i) => (
                    <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-white/5 shadow-xl">
                            <AvatarImage src={`https://picsum.photos/seed/${driver.id}/100/100`} />
                            <AvatarFallback className="bg-navy text-white font-black">{driver.name ? driver.name[0] : 'U'}</AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-charcoal",
                            driver.status === 'Online' ? 'bg-active' : 'bg-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-white uppercase tracking-tight">{driver.name || 'Unnamed'}</p>
                          <p className="text-[9px] text-orange uppercase font-black tracking-widest">{driver.vehicleType || 'Unit Unassigned'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="hidden sm:block text-center">
                          <p className="text-[8px] text-white/30 uppercase font-black mb-0.5">Tactical Rating</p>
                          <div className="flex items-center justify-center gap-1 text-orange font-black text-xs">
                            <Star className={cn("w-3 h-3", (driver.rating || 0) > 0 ? "fill-orange" : "text-white/20")} />
                            {driver.rating > 0 ? driver.rating.toFixed(1) : 'NEW'}
                          </div>
                        </div>
                        <div className="hidden sm:block text-center">
                          <p className="text-[8px] text-white/30 uppercase font-black mb-0.5">Protocol ID</p>
                          <p className="text-xs font-mono font-black text-white/80">{driver.id.substring(0, 6).toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-black px-2 py-0.5",
                            driver.status === 'Online' ? 'border-active text-active bg-active/5' : 
                            (driver.status === 'pending' || driver.status === 'Pending') ? 'border-orange text-orange bg-orange/5' : 'border-white/10 text-white/40'
                          )}>
                            {driver.status || 'Offline'}
                          </Badge>
                          <Link href={`/dashboard/drivers/${driver.id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-orange hover:bg-orange/10">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!drivers?.length && (
                    <div className="p-20 text-center opacity-20">
                      <Users className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-sm font-black uppercase">No operators detected in registry</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="glass-panel border-none shadow-2xl">
            <CardHeader className="p-4 border-b border-white/5 bg-navy/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white/60">
                <Timer className="w-4 h-4 text-orange" />
                Live Shift Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto scrollbar-hide">
                {isShiftsLoading ? (
                  <div className="p-10 text-center animate-pulse">
                    <p className="text-[10px] font-black uppercase text-white/20">Scanning Feed...</p>
                  </div>
                ) : (
                  <>
                    {shifts?.slice(0, 10).map((shift, i) => (
                      <div key={i} className="p-4 space-y-2 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{shift.shiftDate}</span>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase",
                            shift.status === 'Active' ? "bg-active/10 text-active border-active/20" : "bg-white/5 text-white/40 border-white/5"
                          )}>
                            {shift.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-black text-white uppercase">ID: {shift.driverId.substring(0, 8)}</p>
                        <div className="flex items-center gap-4 text-[9px] font-black uppercase text-white/40">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> IN: {shift.punchInTime?.toDate?.()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || "N/A"}</span>
                          {shift.punchOutTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> OUT: {shift.punchOutTime?.toDate?.()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </div>
                      </div>
                    ))}
                    {!shifts?.length && (
                      <div className="p-8 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-white/10" />
                        <p className="text-[9px] uppercase font-black text-white/20">No active shifts detected</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
