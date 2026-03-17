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
  Info,
  ChevronRight,
  IndianRupee
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, doc } from "firebase/firestore"
import { analyzeRoute, type AnalyzeRouteOutput } from "@/ai/flows/route-strategist-flow"
import { Skeleton } from "@/components/ui/skeleton"

export default function RideHistoryPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [analyzingRideId, setAnalyzingRideId] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AnalyzeRouteOutput>>({})

  // Fetch User Profile to determine role for filtering
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile } = useDoc(userProfileRef)
  const role = profile?.role || "Passenger"

  // MISSION ARCHIVE QUERY: Explicitly filter by role ID to satisfy Security Rules (Simple & Safe)
  const ridesQuery = useMemoFirebase(() => {
    if (!user || !db || !profile) return null
    
    // Ownership check: must be either passenger or driver
    const filterKey = role === "Driver" ? "driverId" : "passengerId"
    
    // Note: This query requires a composite index in production. 
    // If it fails, remove the orderBy("createdAt", "desc") temporarily.
    return query(
      collection(db, "rides"),
      where(filterKey, "==", user.uid),
      orderBy("createdAt", "desc")
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
      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
            <History className="w-10 h-10 text-orange" />
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
        {/* Main List Archive */}
        <div className="xl:col-span-3 space-y-6">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="glass-panel p-8">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/4 bg-navy/40" />
                  <Skeleton className="h-12 w-full bg-navy/40" />
                  <Skeleton className="h-12 w-full bg-navy/40" />
                </div>
              </Card>
            ))
          ) : rides && rides.length > 0 ? (
            rides.map((ride) => (
              <Card key={ride.id} className="glass-panel overflow-hidden border-2 border-white/5 hover:border-orange/30 transition-all duration-300 group bg-card/80">
                <CardContent className="p-0">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center text-orange border border-orange/20">
                          {ride.vehicleType === 'Bike' ? <Zap className="w-7 h-7" /> : <Navigation className="w-7 h-7" />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-orange tracking-[0.2em] mb-1">{ride.vehicleType} PROTOCOL</p>
                          <p className="text-sm font-bold text-white/80 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {ride.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'} • {ride.createdAt?.toDate?.()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-3xl font-black text-white tracking-tighter">₹{ride.fare}</p>
                        <Badge className={
                          ride.status === 'Completed' || ride.status === 'Paid' ? 'bg-active/20 text-active border-active/40 font-black' : 
                          ride.status === 'Cancelled' ? 'bg-emergency/20 text-emergency border-emergency/40 font-black' : 
                          'bg-orange/20 text-orange border-orange/40 font-black'
                        }>
                          {ride.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-active/20 flex items-center justify-center shrink-0 border border-active/30">
                          <MapPin className="w-4 h-4 text-active" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-white/50 uppercase mb-1 tracking-widest">Origin Sector</p>
                          <p className="text-sm font-bold text-white truncate">{ride.pickup.address}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-emergency/20 flex items-center justify-center shrink-0 border border-emergency/30">
                          <Navigation className="w-4 h-4 text-emergency" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-white/50 uppercase mb-1 tracking-widest">Target Destination</p>
                          <p className="text-sm font-bold text-white truncate">{ride.dropoff.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NexAI Strategic Integration */}
                  <div className="bg-navy/30 border-t border-white/10 p-5">
                    <AnimatePresence mode="wait">
                      {aiAnalysis[ride.id] ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 text-orange mb-2">
                            <BrainCircuit className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">NexAI Tactical Briefing</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-3">
                              <p className="text-xs text-white/90 leading-relaxed font-medium italic border-l-2 border-orange/40 pl-4 py-1">
                                "{aiAnalysis[ride.id].strategy}"
                              </p>
                              <div className="mt-4 flex items-start gap-3 text-[10px] font-black text-active uppercase bg-active/5 p-2 rounded border border-active/10">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                {aiAnalysis[ride.id].safetyAdvisory}
                              </div>
                            </div>
                            <div className="bg-charcoal/80 p-4 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                              <p className="text-[9px] font-black text-white/40 uppercase mb-1">Efficiency Rating</p>
                              <p className="text-3xl font-black text-orange">{aiAnalysis[ride.id].efficiencyScore}%</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Info className="w-4 h-4 text-white/40" />
                            <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider">
                              Perform tactical analysis on this deployment?
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={analyzingRideId === ride.id}
                            onClick={() => handleRunAiAnalysis(ride)}
                            className="text-[10px] font-black uppercase text-orange border-orange/30 hover:bg-orange hover:text-white transition-all h-9 px-4"
                          >
                            {analyzingRideId === ride.id ? (
                              <Zap className="w-3.5 h-3.5 animate-spin mr-2" />
                            ) : (
                              <BrainCircuit className="w-3.5 h-3.5 mr-2" />
                            )}
                            {analyzingRideId === ride.id ? "Analyzing Sector..." : "Run NexAI Brief"}
                          </Button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-32 bg-navy/20 rounded-2xl border-2 border-dashed border-white/10">
               <div className="w-20 h-20 bg-navy/30 rounded-full flex items-center justify-center mx-auto mb-6">
                 <History className="w-10 h-10 text-white/10" />
               </div>
               <h3 className="text-xl font-black uppercase text-white mb-2">No Mission Logs</h3>
               <p className="text-xs font-bold uppercase tracking-widest text-white/40">Historical data bank is currently empty</p>
               <Button 
                className="mt-8 bg-orange text-white font-black uppercase text-xs h-12 px-8" 
                onClick={() => window.location.href='/dashboard/passenger'}
               >
                 Initialize First Mission
               </Button>
            </div>
          )}
        </div>

        {/* Tactical Insights Sidebar */}
        <aside className="space-y-8">
          <Card className="glass-panel border-t-4 border-orange">
            <CardHeader className="p-6 bg-navy/40 border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-active" />
                Fleet Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-black uppercase text-white">
                  <span>Bike Dominance</span>
                  <span className="text-orange">72%</span>
                </div>
                <div className="h-2 w-full bg-navy/60 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} className="h-full bg-orange shadow-[0_0_10px_#FF8000]" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-black uppercase text-white">
                  <span>Peak Efficiency Cycles</span>
                  <span className="text-active">88%</span>
                </div>
                <div className="h-2 w-full bg-navy/60 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: "88%" }} className="h-full bg-active shadow-[0_0_10px_#00CC00]" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 text-white/60 mb-3">
                  <ShieldCheck className="w-4 h-4 text-active" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Compliance Status: OPTIMAL</span>
                </div>
                <p className="text-[10px] text-white/50 uppercase font-bold leading-relaxed">
                  Based on your last mission set, you are maintaining a 100% resolution rate with zero tactical deviations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel bg-active/5 border-active/20">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full border-4 border-active/20 border-t-active mx-auto flex items-center justify-center">
                <span className="text-3xl font-black text-white">100</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-white tracking-widest">Reputation Score</p>
                <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Verified Operator Protocol</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
