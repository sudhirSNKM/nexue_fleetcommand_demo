
"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock, 
  MapPin, 
  Navigation, 
  CreditCard, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  BrainCircuit, 
  TrendingUp,
  Search,
  History,
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { analyzeRoute, type AnalyzeRouteOutput } from "@/ai/flows/route-strategist-flow"
import { Skeleton } from "@/components/ui/skeleton"

export default function RideHistoryPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [analyzingRideId, setAnalyzingRideId] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AnalyzeRouteOutput>>({})

  // MISSION ARCHIVE QUERY: Must use explicit passengerId filter for security compliance
  const ridesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "rides"),
      where("passengerId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [user, db])

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <History className="w-8 h-8 text-orange" />
            Mission Archives
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Historical deployment logs and tactical auditing</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 bg-navy/20 px-4 py-2 rounded-lg border border-white/5">
           <div className="text-right">
             <p className="text-[10px] text-muted-foreground uppercase font-black">Total Missions</p>
             <p className="text-xl font-mono font-bold">{rides?.length || 0}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="xl:col-span-2 space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="glass-panel p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-1/4 bg-navy/40" />
                  <Skeleton className="h-8 w-full bg-navy/40" />
                  <Skeleton className="h-12 w-full bg-navy/40" />
                </div>
              </Card>
            ))
          ) : rides && rides.length > 0 ? (
            rides.map((ride) => (
              <Card key={ride.id} className="glass-panel overflow-hidden border-l-4 border-orange hover:bg-navy/5 transition-all">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center text-orange">
                          {ride.vehicleType === 'Bike' ? <Zap className="w-6 h-6" /> : <Navigation className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">{ride.vehicleType} PROTOCOL</p>
                          <p className="text-sm font-bold text-muted-foreground">
                            {ride.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'} • {ride.createdAt?.toDate?.()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-white">₹{ride.fare}</p>
                        <Badge className={
                          ride.status === 'Completed' || ride.status === 'Paid' ? 'bg-active/20 text-active border-active/30' : 
                          ride.status === 'Cancelled' ? 'bg-emergency/20 text-emergency border-emergency/30' : 
                          'bg-orange/20 text-orange border-orange/30'
                        }>
                          {ride.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-navy/20 hidden md:block" />
                      
                      <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-active/20 flex items-center justify-center shrink-0 z-10">
                          <MapPin className="w-3 h-3 text-active" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Pickup Origin</p>
                          <p className="text-sm font-bold truncate max-w-[200px]">{ride.pickup.address}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-emergency/20 flex items-center justify-center shrink-0 z-10">
                          <Navigation className="w-3 h-3 text-emergency" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Dropoff Target</p>
                          <p className="text-sm font-bold truncate max-w-[200px]">{ride.dropoff.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NexAI Integration */}
                  <div className="bg-navy/30 border-t border-white/5 p-4">
                    <AnimatePresence mode="wait">
                      {aiAnalysis[ride.id] ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 text-orange mb-2">
                            <BrainCircuit className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">NexAI Tactical Briefing</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground leading-relaxed italic">"{aiAnalysis[ride.id].strategy}"</p>
                              <div className="mt-3 flex items-start gap-2 text-[10px] font-bold text-active uppercase">
                                <ShieldCheck className="w-3 h-3 mt-0.5" />
                                {aiAnalysis[ride.id].safetyAdvisory}
                              </div>
                            </div>
                            <div className="bg-charcoal/50 p-3 rounded border border-white/5 text-center">
                              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Efficiency</p>
                              <p className="text-2xl font-black text-orange">{aiAnalysis[ride.id].efficiencyScore}%</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                            <Info className="w-3 h-3" /> Analyze this mission for tactical insights?
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={analyzingRideId === ride.id}
                            onClick={() => handleRunAiAnalysis(ride)}
                            className="text-[9px] font-black uppercase text-orange hover:bg-orange/10 h-7"
                          >
                            {analyzingRideId === ride.id ? (
                              <Zap className="w-3 h-3 animate-spin mr-2" />
                            ) : (
                              <BrainCircuit className="w-3 h-3 mr-2" />
                            )}
                            {analyzingRideId === ride.id ? "Analyzing..." : "NexAI Brief"}
                          </Button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-24 bg-navy/10 rounded-xl border border-dashed border-navy/30">
               <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
               <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No historical mission logs detected</p>
               <Button className="mt-6 bg-orange font-black uppercase text-xs" onClick={() => window.location.href='/dashboard/passenger'}>Initialize First Mission</Button>
            </div>
          )}
        </div>

        {/* Sidebar Insights */}
        <aside className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-active" />
                Fleet Usage Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                  <span>Bike Preferred</span>
                  <span className="text-orange">68%</span>
                </div>
                <div className="h-1.5 w-full bg-navy/30 rounded-full overflow-hidden">
                  <div className="h-full bg-orange w-[68%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                  <span>Rush Hour Missions</span>
                  <span className="text-emergency">22%</span>
                </div>
                <div className="h-1.5 w-full bg-navy/30 rounded-full overflow-hidden">
                  <div className="h-full bg-emergency w-[22%]" />
                </div>
              </div>
              <div className="pt-4 border-t border-navy/20">
                <p className="text-[9px] text-muted-foreground uppercase font-medium leading-relaxed">
                  Based on your last {rides?.length || 0} missions, you are operating at peak efficiency during morning cycles.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden border-active/30">
            <CardContent className="p-0">
               <div className="p-4 bg-active/10 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-active" />
                  <span className="text-[10px] font-black uppercase text-active">Safety Status: NOMINAL</span>
               </div>
               <div className="p-6 text-center">
                  <p className="text-xs font-bold mb-4 uppercase">Verified Operator Protocol</p>
                  <div className="w-16 h-16 rounded-full border-4 border-active/20 border-t-active mx-auto mb-4 flex items-center justify-center font-black text-xl">
                    100
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Reputation Index</p>
               </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
