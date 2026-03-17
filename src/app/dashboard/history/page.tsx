"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock, 
  MapPin, 
  Navigation, 
  History, 
  Zap, 
  BrainCircuit, 
  ShieldCheck, 
  TrendingUp, 
  History as HistoryIcon
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

  // Fetch User Profile
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile } = useDoc(userProfileRef)
  const role = profile?.role || "Passenger"

  // MISSION ARCHIVE QUERY: Removed orderBy to bypass index-related permission errors
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
      console.error("NexAI Analysis Failed:", error)
    } finally {
      setAnalyzingRideId(null)
    }
  }

  const totalEarnings = rides?.reduce((sum, ride) => sum + (ride.fare || 0), 0) || 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
            <HistoryIcon className="w-10 h-10 text-orange" />
            Mission Archives
          </h1>
          <p className="text-sm text-white/70 font-bold uppercase tracking-[0.2em] mt-1">Operational History & Tactical Auditing</p>
        </div>
        
        <div className="flex gap-4">
          <Card className="glass-panel px-6 py-3 border-l-4 border-orange bg-navy/40">
            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Total Deployments</p>
            <p className="text-2xl font-mono font-black text-white leading-none">{rides?.length || 0}</p>
          </Card>
          <Card className="glass-panel px-6 py-3 border-l-4 border-active bg-navy/40">
            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Total Credits</p>
            <p className="text-2xl font-mono font-black text-active leading-none">₹{totalEarnings}</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="glass-panel p-6">
                <Skeleton className="h-24 w-full bg-navy/20" />
              </Card>
            ))
          ) : rides && rides.length > 0 ? (
            rides.map((ride) => (
              <Card key={ride.id} className="glass-panel border-white/5 bg-card/80 hover:border-orange/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-navy/40 flex items-center justify-center text-orange border border-white/5">
                        {ride.vehicleType === 'Bike' ? <Zap className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange tracking-widest">{ride.vehicleType} PROTOCOL</p>
                        <p className="text-xs font-bold text-white/80">
                          ID: {ride.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-white">₹{ride.fare}</p>
                       <Badge className={cn("text-[9px] font-black uppercase", ride.status === 'Completed' ? 'bg-active/20 text-active' : 'bg-orange/20 text-orange')}>
                         {ride.status}
                       </Badge>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <MapPin className="w-4 h-4 text-active shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase">Origin</p>
                        <p className="text-xs font-bold text-white/90 truncate max-w-[250px]">{ride.pickup?.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Navigation className="w-4 h-4 text-emergency shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase">Target</p>
                        <p className="text-xs font-bold text-white/90 truncate max-w-[250px]">{ride.dropoff?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    {aiAnalysis[ride.id] ? (
                      <div className="bg-navy/20 p-4 rounded-lg border border-orange/10">
                        <div className="flex items-center gap-2 mb-2">
                           <BrainCircuit className="w-4 h-4 text-orange" />
                           <span className="text-[10px] font-black uppercase text-orange">Tactical Briefing</span>
                        </div>
                        <p className="text-xs text-white/70 italic leading-relaxed">"{aiAnalysis[ride.id].strategy}"</p>
                        <div className="mt-3 flex items-center gap-4">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-active uppercase">
                             <ShieldCheck className="w-3 h-3" /> Efficiency: {aiAnalysis[ride.id].efficiencyScore}%
                           </div>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRunAiAnalysis(ride)}
                        className="text-[10px] font-black uppercase text-white/40 hover:text-orange hover:bg-orange/10"
                      >
                        {analyzingRideId === ride.id ? <Zap className="w-3 h-3 animate-spin mr-2" /> : <BrainCircuit className="w-3 h-3 mr-2" />}
                        {analyzingRideId === ride.id ? "Analyzing Sector..." : "Run NexAI Analysis"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glass-panel p-20 text-center border-dashed border-white/10">
              <HistoryIcon className="w-12 h-12 mx-auto text-white/10 mb-4" />
              <h3 className="text-xl font-black uppercase text-white mb-2">Logs Cleared</h3>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No previous deployments archived in this sector</p>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel bg-navy/40 border-t-4 border-active">
             <CardHeader className="p-6">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-active" /> Performance Matrix
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div>
                   <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                     <span className="text-white/60">Mission Success</span>
                     <span className="text-active">100%</span>
                   </div>
                   <div className="h-1 w-full bg-navy/60 rounded-full overflow-hidden">
                      <div className="h-full bg-active" style={{ width: "100%" }} />
                   </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                   <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed">
                     Your tactical performance is optimal. No deviations detected in mission logs.
                   </p>
                </div>
             </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}