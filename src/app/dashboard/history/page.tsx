"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

  // Strictly filtered query to match security rules
  // Removed orderBy to bypass potential indexing issues during confirmed debug phase
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
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
            <HistoryIcon className="w-10 h-10 text-orange" />
            Mission Archives
          </h1>
          <p className="text-sm text-white/70 font-bold uppercase tracking-widest mt-1">Operational History Audit</p>
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
            [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full bg-navy/20" />)
          ) : rides && rides.length > 0 ? (
            rides.map((ride) => (
              <Card key={ride.id} className="glass-panel border-white/10 bg-card/80 hover:border-orange/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-navy/40 flex items-center justify-center text-orange">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange">{ride.vehicleType} PROTOCOL</p>
                        <p className="text-xs font-bold text-white/80">ID: {ride.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-white">₹{ride.fare}</p>
                       <Badge className={cn("text-[9px] font-black uppercase", ride.status === 'Completed' ? 'bg-active/20 text-active' : 'bg-orange/20 text-orange')}>
                         {ride.status}
                       </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="flex gap-3">
                      <MapPin className="w-4 h-4 text-active shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase">Origin</p>
                        <p className="text-xs font-bold text-white/90">{ride.pickup?.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Navigation className="w-4 h-4 text-emergency shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase">Target</p>
                        <p className="text-xs font-bold text-white/90">{ride.dropoff?.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    {aiAnalysis[ride.id] ? (
                      <div className="bg-navy/20 p-4 rounded-lg border border-orange/10">
                        <p className="text-[10px] font-black uppercase text-orange mb-2 flex items-center gap-2">
                          <BrainCircuit className="w-3 h-3" /> Tactical Briefing
                        </p>
                        <p className="text-xs text-white/70 italic leading-relaxed">"{aiAnalysis[ride.id].strategy}"</p>
                        <div className="mt-2 flex items-center gap-4 text-[9px] font-black uppercase">
                           <span className="text-active flex items-center gap-1">
                             <ShieldCheck className="w-3 h-3" /> Efficiency: {aiAnalysis[ride.id].efficiencyScore}%
                           </span>
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
                        {analyzingRideId === ride.id ? "Analyzing..." : "Run Analysis"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glass-panel p-20 text-center border-dashed border-white/10">
              <HistoryIcon className="w-12 h-12 mx-auto text-white/10 mb-4" />
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No previous deployments archived</p>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel bg-navy/40 border-t-4 border-active">
             <CardHeader className="p-6">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-active" /> Performance
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="space-y-4">
                   <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span className="text-white/60">Success Rate</span>
                        <span className="text-active">100%</span>
                      </div>
                      <div className="h-1 w-full bg-navy/60 rounded-full overflow-hidden">
                        <div className="h-full bg-active" style={{ width: "100%" }} />
                      </div>
                   </div>
                   <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed">
                     Tactical performance is within optimal parameters.
                   </p>
                </div>
             </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}