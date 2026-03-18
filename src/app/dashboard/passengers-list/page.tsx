
"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  ShieldCheck, 
  UserX,
  UserCheck,
  Phone,
  Mail,
  MoreVertical,
  Activity,
  Zap,
  Loader2,
  Lock,
  Eye
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, where, doc, limit, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function PassengersListPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  
  const role = (profile?.role || "").toLowerCase().replace(/\s+/g, '-')
  const isSuperAdmin = role === "super-admin"
  const isUserAdmin = role === "admin" || isSuperAdmin

  const passengersQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(
    collection(db, "userProfiles"), 
    where("role", "==", "passenger"),
    limit(50)
  ) : null, [db, isUserAdmin])

  const { data: passengers, isLoading } = useCollection(passengersQuery)

  // Fetch recent rides to correlate passengers with drivers
  const recentRidesQuery = useMemoFirebase(() => (db && isUserAdmin) ? query(
    collection(db, "rides"),
    orderBy("createdAt", "desc"),
    limit(100)
  ) : null, [db, isUserAdmin])
  const { data: recentRides } = useCollection(recentRidesQuery)

  const maskPhone = (phone: string) => {
    if (isSuperAdmin) return phone || 'NO LINK';
    if (!phone) return "PROTECTED";
    return phone.replace(/(\d{2})\d+(\d{4})/, "$1******$2");
  }

  const maskEmail = (email: string) => {
    if (isSuperAdmin) return email;
    if (!email) return "PROTECTED";
    const [name, domain] = email.split("@");
    return `${name[0]}***@${domain}`;
  }

  const getPassengerLastRide = (passengerId: string) => {
    return recentRides?.find(r => r.passengerId === passengerId);
  }

  if (!isUserAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-charcoal text-white min-h-[400px]">
        <ShieldCheck className="w-12 h-12 text-emergency mb-2" />
        <h2 className="text-xl font-black uppercase">Access Restricted</h2>
        <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Administrative Clearance Level Required</p>
      </div>
    )
  }

  const handleStatusToggle = (passengerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active'
    updateDocumentNonBlocking(doc(db, "userProfiles", passengerId), { status: newStatus })
    toast({
      title: "Governance Update",
      description: `Passenger status synchronized to ${newStatus}.`,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Passenger Registry</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">
            {isSuperAdmin ? 'Full Access Infrastructure Audit' : 'Restricted Privacy Monitoring Active'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange transition-colors" />
            <input 
              placeholder="Filter Registry..." 
              className="bg-navy/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange/50 transition-all w-64"
            />
          </div>
          {!isSuperAdmin && (
            <Badge className="bg-orange/10 text-orange border-orange/20 uppercase font-black text-[8px] flex items-center gap-2">
              <Lock className="w-3 h-3" /> Data Masking Active
            </Badge>
          )}
        </div>
      </div>

      <Card className="glass-panel border-none shadow-2xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy/30 text-white/40 uppercase font-black tracking-widest text-[10px]">
                <th className="p-4 border-r border-white/5">Client Identity</th>
                <th className="p-4 border-r border-white/5">Secured Comm Links</th>
                <th className="p-4 border-r border-white/5">Last Mission Correlation</th>
                <th className="p-4 border-r border-white/5">Status</th>
                <th className="p-4">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white font-bold uppercase text-[10px]">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-4"><div className="h-4 bg-white/5 rounded w-full" /></td>
                  </tr>
                ))
              ) : passengers?.map((passenger) => {
                const lastRide = getPassengerLastRide(passenger.id);
                return (
                  <tr key={passenger.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-1 ring-white/10 shadow-lg">
                          <AvatarImage src={`https://picsum.photos/seed/${passenger.id}/100/100`} />
                          <AvatarFallback className="bg-navy text-xs font-black">{passenger.name ? passenger.name[0] : 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-black">{passenger.name || 'Unnamed Client'}</p>
                          <p className="text-[8px] text-white/40 font-mono tracking-tighter">ID: {passenger.id.substring(0, 12)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2 text-[9px] text-white/60">
                          <Phone className={cn("w-3 h-3", isSuperAdmin ? "text-active" : "text-white/20")} /> 
                          {maskPhone(passenger.phone)}
                        </span>
                        <span className="flex items-center gap-2 text-[9px] text-white/60">
                          <Mail className={cn("w-3 h-3", isSuperAdmin ? "text-active" : "text-white/20")} /> 
                          {maskEmail(passenger.email)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {lastRide ? (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-orange">
                            <Zap className="w-3 h-3" /> {lastRide.vehicleType} UNIT
                          </span>
                          <span className="text-[8px] text-white/40 font-mono italic">Operator: {lastRide.driverId?.substring(0,8)}...</span>
                        </div>
                      ) : (
                        <span className="text-white/20 text-[8px] italic">No Recent Activity Detected</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5",
                        passenger.status === 'Active' ? "bg-active/10 text-active border-active/20" : "bg-emergency/10 text-emergency border-emergency/20"
                      )}>
                        {passenger.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusToggle(passenger.id, passenger.status || 'Active')}
                          className={cn(
                            "text-[8px] font-black uppercase h-7 px-3",
                            passenger.status === 'Active' ? "text-emergency hover:bg-emergency/10" : "text-active hover:bg-active/10"
                          )}
                        >
                          {passenger.status === 'Active' ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                          {passenger.status === 'Active' ? 'Suspend' : 'Authorize'}
                        </Button>
                        {isSuperAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!passengers?.length && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-20 text-center opacity-20 italic">
                    <Activity className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-black uppercase">No passenger units detected in current sector</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
