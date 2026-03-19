
"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  Clock, 
  MapPin, 
  Navigation, 
  History as HistoryIcon, 
  Zap, 
  BrainCircuit, 
  ShieldCheck, 
  TrendingUp 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc, limit, orderBy } from "firebase/firestore"
import { analyzeRoute, type AnalyzeRouteOutput } from "@/ai/flows/route-strategist-flow"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function RideHistoryPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [analyzingRideId, setAnalyzingRideId] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AnalyzeRouteOutput>>({})

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  
  const rawRole = (profile?.role || "passenger").toLowerCase().trim()
  const role = rawRole.replace(/[\s_-]+/g, '-')
  const isAdmin = role === "admin" || role === "super-admin"
  const isMobilityUser = !isAdmin

  const ridesQuery = useMemoFirebase(() => {
    if (!user || !db || !profile) return null
    if (isAdmin) {
      return query(
        collection(db, "rides"),
        orderBy("createdAt", "desc"),
        limit(100)
      )
    }
    const filterKey = role === "driver" ? "driverId" : "passengerId"
    return query(
      collection(db, "rides"),
      where(filterKey, "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    )
  }, [user, db, profile, role, isAdmin])

  const { data: rides, isLoading } = useCollection(ridesQuery)

  const handleRunAiAnalysis = async (ride: any) => {
    setAnalyzingRideId(ride.id)
    try {
      const result = await analyzeRoute({
        pickup: ride.pickup?.address || "Unknown Origin",
        dropoff: ride.dropoff?.address || "Unknown Target",
        vehicleType: ride.vehicleType || "Scout"
      })
      setAiAnalysis(prev => ({ ...prev, [ride.id]: result }))
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setAnalyzingRideId(null)
    }
  }

  const totalEarnings = rides?.reduce((sum, ride) => sum + (Number(ride.fare) || 0), 0) || 0

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-20 sm:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={cn("text-2xl sm:text-3xl font-black uppercase tracking-tighter flex items-center gap-3", isMobilityUser ? "text-slate-900" : "text-white")}>
            <HistoryIcon className="w-8 h-8 sm:w-10 sm:h-10 text-orange" />
            Mission Archives
          </h1>
          <p className={cn("text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1", isMobilityUser ? "text-slate-500" : "text-white/70")}>
            {isAdmin ? "Global Infrastructure Manifest" : "Operational History Log"}
          </p>
        </div>
        
        <div className="flex gap-3 sm:gap-4">
          <Card className={cn("px-4 py-2 sm:px-6 sm:py-3 border-l-4 border-orange shadow-lg flex-1 sm:flex-initial", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-navy/40")}>
            <p className={cn("text-[8px] sm:text-[10px] uppercase font-black tracking-widest mb-1", isMobilityUser ? "text-slate-400" : "text-white/50")}>Deployments</p>
            <p className={cn("text-lg sm:text-2xl font-mono font-black", isMobilityUser ? "text-slate-900" : "text-white")}>{rides?.length || 0}</p>
          </Card>
          <Card className={cn("px-4 py-2 sm:px-6 sm:py-3 border-l-4 border-active shadow-lg flex-1 sm:flex-initial", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-navy/40")}>
            <p className={cn("text-[8px] sm:text-[10px] uppercase font-black tracking-widest mb-1", isMobilityUser ? "text-slate-400" : "text-white/50")}>Credits</p>
            <p className={cn("text-lg sm:text-2xl font-mono font-black", isMobilityUser ? "text-slate-900" : "text-active")}>₹{totalEarnings}</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
        <div className="xl:col-span-3 space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className={cn("h-40 w-full rounded-2xl", isMobilityUser ? "bg-slate-200" : "bg-navy/20")} />)
          ) : rides && rides.length > 0 ? (
            rides.map((ride) => (
              <Card key={ride.id} className={cn("border-none shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-card/80")}>
                <CardContent className="p-0">
                  <div className={cn("p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4", isMobilityUser ? "bg-slate-50 border-b border-slate-100" : "bg-navy/20 border-b border-white/5")}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-orange shadow-inner shrink-0", isMobilityUser ? "bg-white" : "bg-navy/40")}>
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] sm:text-[10px] font-black uppercase text-orange tracking-widest">{(ride.vehicleType || "Scout").toUpperCase()} PROTOCOL</p>
                        <p className={cn("text-[10px] sm:text-sm font-bold truncate", isMobilityUser ? "text-slate-900" : "text-white")}>MISSION ID: {ride.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2">
                       <p className={cn("text-xl sm:text-2xl font-black", isMobilityUser ? "text-slate-900" : "text-white")}>₹{ride.fare}</p>
                       <Badge className={cn("text-[8px] sm:text-[10px] font-black uppercase tracking-widest", ride.status === 'Completed' || ride.status === 'Paid' ? 'bg-green-500/10 text-green-600' : 'bg-orange/10 text-orange')}>
                         {ride.status} {ride.status === 'Paid' && ride.paymentMethod ? `• ${ride.paymentMethod.toUpperCase()}` : ''}
                       </Badge>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-active ring-4 ring-active/10" />
                        <div className="w-0.5 h-10 sm:h-12 bg-slate-200 my-1" />
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange ring-4 ring-orange/10" />
                      </div>
                      <div className="space-y-4 sm:space-y-6 min-w-0 flex-1">
                        <div className="min-w-0">
                          <p className={cn("text-[8px] sm:text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-400" : "text-white/40")}>Origin Point</p>
                          <p className={cn("text-[11px] sm:text-sm font-bold truncate", isMobilityUser ? "text-slate-900" : "text-white/90")}>{ride.pickup?.address || "Calibrating..."}</p>
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-[8px] sm:text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-400" : "text-white/40")}>Target Destination</p>
                          <p className={cn("text-[11px] sm:text-sm font-bold truncate", isMobilityUser ? "text-slate-900" : "text-white/90")}>{ride.dropoff?.address || "Calibrating..."}</p>
                        </div>
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-xl border flex flex-col justify-center", isMobilityUser ? "bg-slate-50 border-slate-100" : "bg-navy/10 border-white/5")}>
                       <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <span className={cn("text-[8px] sm:text-[10px] font-black uppercase", isMobilityUser ? "text-slate-400" : "text-white/40")}>Operational AI Briefing</span>
                          <BrainCircuit className="w-3 h-3 sm:w-4 sm:h-4 text-orange" />
                       </div>
                       
                       {aiAnalysis[ride.id] ? (
                         <div className="space-y-2 sm:space-y-3">
                           <p className={cn("text-[10px] sm:text-xs italic font-medium leading-relaxed", isMobilityUser ? "text-slate-600" : "text-white/70")}>"{aiAnalysis[ride.id].strategy}"</p>
                           <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black text-green-600">
                                <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> EFFICACY: {aiAnalysis[ride.id].efficiencyScore}%
                              </span>
                           </div>
                         </div>
                       ) : (
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleRunAiAnalysis(ride)}
                           className={cn("w-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest border-orange/30 text-orange hover:bg-orange hover:text-white transition-all", isMobilityUser ? "bg-white" : "bg-navy/20")}
                         >
                           {analyzingRideId === ride.id ? <Zap className="w-3 h-3 animate-spin mr-2" /> : <BrainCircuit className="w-3 h-3 mr-2" />}
                           {analyzingRideId === ride.id ? "Analyzing..." : "Initialize Tactical Brief"}
                         </Button>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className={cn("p-12 sm:p-20 text-center border-2 border-dashed rounded-3xl", isMobilityUser ? "bg-white border-slate-200" : "glass-panel border-white/10 bg-white/5")}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <HistoryIcon className={cn("w-8 h-8 sm:w-10 sm:h-10", isMobilityUser ? "text-slate-300" : "text-muted-foreground")} />
              </div>
              <h2 className={cn("text-lg sm:text-xl font-black uppercase mb-2", isMobilityUser ? "text-slate-900" : "text-white")}>Archive Empty</h2>
              <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-widest", isMobilityUser ? "text-slate-400" : "text-muted-foreground")}>No historical missions detected in current sector.</p>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className={cn("border-t-4 border-green-500 shadow-xl overflow-hidden", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-navy/40")}>
             <CardHeader className={cn("p-4 sm:p-6", isMobilityUser ? "bg-slate-50 border-b border-slate-100" : "bg-navy/20 border-b border-white/5")}>
               <CardTitle className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2", isMobilityUser ? "text-slate-900" : "text-white")}>
                 <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" /> Performance Audit
               </CardTitle>
             </CardHeader>
             <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between text-[8px] sm:text-[10px] font-black uppercase mb-2 tracking-widest">
                        <span className={isMobilityUser ? "text-slate-400" : "text-white/60"}>Mission Success</span>
                        <span className="text-green-600 font-mono">100%</span>
                      </div>
                      <div className={cn("h-1 sm:h-1.5 w-full rounded-full overflow-hidden shadow-inner", isMobilityUser ? "bg-slate-100" : "bg-navy/60")}>
                        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-green-500" />
                      </div>
                   </div>
                   <div className={cn("p-3 sm:p-4 rounded-xl", isMobilityUser ? "bg-slate-50" : "bg-navy/10")}>
                     <p className={cn("text-[8px] sm:text-[10px] font-black uppercase leading-relaxed text-center", isMobilityUser ? "text-slate-500" : "text-muted-foreground")}>
                       All systems nominal. Operational parameters within safety threshold.
                     </p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
