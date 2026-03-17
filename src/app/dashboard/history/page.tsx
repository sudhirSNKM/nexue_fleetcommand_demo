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
import { collection, query, where, doc, limit } from "firebase/firestore"
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
  
  const role = profile?.role || "Passenger"
  const isMobilityUser = role === "Passenger" || role === "Driver"

  // Filter query by user role and ID to comply with security rules
  const ridesQuery = useMemoFirebase(() => {
    if (!user || !db || !profile) return null
    const filterKey = role === "Driver" ? "driverId" : "passengerId"
    return query(
      collection(db, "rides"),
      where(filterKey, "==", user.uid),
      limit(20)
    )
  }, [user, db, profile, role])

  const { data: rides, isLoading } = useCollection(ridesQuery)

  const handleRunAiAnalysis = async (ride: any) => {
    setAnalyzingRideId(ride.id)
    try {
      const result = await analyzeRoute({
        pickup: ride.pickup.address,
        dropoff: ride.dropoff.address,
        vehicleType: ride.vehicleType
      })
      setAiAnalysis(prev => ({ ...prev, [ride.id]: result }))
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setAnalyzingRideId(null)
    }
  }

  const totalEarnings = rides?.reduce((sum, ride) => sum + (ride.fare || 0), 0) || 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={cn("text-3xl font-black uppercase tracking-tighter flex items-center gap-3", isMobilityUser ? "text-slate-900" : "text-white")}>
            <HistoryIcon className="w-10 h-10 text-orange" />
            Mission Archives
          </h1>
          <p className={cn("text-sm font-bold uppercase tracking-widest mt-1", isMobilityUser ? "text-slate-500" : "text-white/70")}>Operational History Log</p>
        </div>
        
        <div className="flex gap-4">
          <Card className={cn("px-6 py-3 border-l-4 border-orange shadow-lg", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-navy/40")}>
            <p className={cn("text-[10px] uppercase font-black tracking-widest mb-1", isMobilityUser ? "text-slate-400" : "text-white/50")}>Deployments</p>
            <p className={cn("text-2xl font-mono font-black", isMobilityUser ? "text-slate-900" : "text-white")}>{rides?.length || 0}</p>
          </Card>
          <Card className={cn("px-6 py-3 border-l-4 border-active shadow-lg", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-navy/40")}>
            <p className={cn("text-[10px] uppercase font-black tracking-widest mb-1", isMobilityUser ? "text-slate-400" : "text-white/50")}>Credits</p>
            <p className={cn("text-2xl font-mono font-black", isMobilityUser ? "text-slate-900" : "text-active")}>₹{totalEarnings}</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className={cn("h-40 w-full rounded-2xl", isMobilityUser ? "bg-slate-200" : "bg-navy/20")} />)
          ) : rides && rides.length > 0 ? (
            rides.map((ride) => (
              <Card key={ride.id} className={cn("border-none shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-card/80")}>
                <CardContent className="p-0">
                  <div className={cn("p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4", isMobilityUser ? "bg-slate-50 border-b border-slate-100" : "bg-navy/20 border-b border-white/5")}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-orange shadow-inner", isMobilityUser ? "bg-white" : "bg-navy/40")}>
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange tracking-widest">{ride.vehicleType} PROTOCOL</p>
                        <p className={cn("text-sm font-bold", isMobilityUser ? "text-slate-900" : "text-white")}>MISSION ID: {ride.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right w-full md:w-auto">
                       <p className={cn("text-2xl font-black", isMobilityUser ? "text-slate-900" : "text-white")}>₹{ride.fare}</p>
                       <Badge className={cn("text-[10px] font-black uppercase tracking-widest", ride.status === 'Completed' ? 'bg-green-500/10 text-green-600' : 'bg-orange/10 text-orange')}>
                         {ride.status}
                       </Badge>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-active ring-4 ring-active/10" />
                        <div className="w-0.5 h-12 bg-slate-200 my-1" />
                        <div className="w-4 h-4 rounded-full bg-orange ring-4 ring-orange/10" />
                      </div>
                      <div className="space-y-6">
                        <div>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-400" : "text-white/40")}>Origin Point</p>
                          <p className={cn("text-sm font-bold", isMobilityUser ? "text-slate-900" : "text-white/90")}>{ride.pickup?.address}</p>
                        </div>
                        <div>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-400" : "text-white/40")}>Target Destination</p>
                          <p className={cn("text-sm font-bold", isMobilityUser ? "text-slate-900" : "text-white/90")}>{ride.dropoff?.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-xl border flex flex-col justify-center", isMobilityUser ? "bg-slate-50 border-slate-100" : "bg-navy/10 border-white/5")}>
                       <div className="flex items-center justify-between mb-4">
                          <span className={cn("text-[10px] font-black uppercase", isMobilityUser ? "text-slate-400" : "text-white/40")}>Operational AI Briefing</span>
                          <BrainCircuit className="w-4 h-4 text-orange" />
                       </div>
                       
                       {aiAnalysis[ride.id] ? (
                         <div className="space-y-3">
                           <p className={cn("text-xs italic font-medium leading-relaxed", isMobilityUser ? "text-slate-600" : "text-white/70")}>"{aiAnalysis[ride.id].strategy}"</p>
                           <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 text-[10px] font-black text-green-600">
                                <ShieldCheck className="w-3 h-3" /> EFFICACY: {aiAnalysis[ride.id].efficiencyScore}%
                              </span>
                           </div>
                         </div>
                       ) : (
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleRunAiAnalysis(ride)}
                           className={cn("w-full text-[10px] font-black uppercase tracking-widest border-orange/30 text-orange hover:bg-orange hover:text-white transition-all", isMobilityUser ? "bg-white" : "bg-navy/20")}
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
            <Card className={cn("p-20 text-center border-2 border-dashed rounded-3xl", isMobilityUser ? "bg-white border-slate-200" : "glass-panel border-white/10")}>
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HistoryIcon className={cn("w-10 h-10", isMobilityUser ? "text-slate-300" : "text-white/10")} />
              </div>
              <h2 className={cn("text-xl font-black uppercase mb-2", isMobilityUser ? "text-slate-900" : "text-white")}>Archive Empty</h2>
              <p className={cn("text-xs font-bold uppercase tracking-widest", isMobilityUser ? "text-slate-400" : "text-white/40")}>No historical missions detected in current sector.</p>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className={cn("border-t-4 border-green-500 shadow-xl overflow-hidden", isMobilityUser ? "bg-white border-slate-200" : "glass-panel bg-navy/40")}>
             <CardHeader className={cn("p-6", isMobilityUser ? "bg-slate-50 border-b border-slate-100" : "bg-navy/20 border-b border-white/5")}>
               <CardTitle className={cn("text-xs font-black uppercase tracking-widest flex items-center gap-2", isMobilityUser ? "text-slate-900" : "text-white")}>
                 <TrendingUp className="w-4 h-4 text-green-500" /> Performance Audit
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
                        <span className={isMobilityUser ? "text-slate-400" : "text-white/60"}>Mission Success</span>
                        <span className="text-green-600 font-mono">100%</span>
                      </div>
                      <div className={cn("h-1.5 w-full rounded-full overflow-hidden shadow-inner", isMobilityUser ? "bg-slate-100" : "bg-navy/60")}>
                        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-green-500" />
                      </div>
                   </div>
                   <div className={cn("p-4 rounded-xl", isMobilityUser ? "bg-slate-50" : "bg-navy/10")}>
                     <p className={cn("text-[10px] font-black uppercase leading-relaxed text-center", isMobilityUser ? "text-slate-500" : "text-white/40")}>
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