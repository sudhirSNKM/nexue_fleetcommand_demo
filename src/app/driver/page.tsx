
"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Square, 
  MapPin, 
  Camera, 
  CreditCard, 
  User, 
  Star,
  Fuel,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Download,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc, limit, orderBy } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function DriverMobileApp() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState<'trip' | 'payout'>('trip')
  const [isTripActive, setIsTripActive] = useState(false)
  const [isPayslipOpen, setIsPayslipOpen] = useState(false)

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)

  const ridesQuery = useMemoFirebase(() => 
    user && db ? query(
      collection(db, "rides"),
      where("driverId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    ) : null, 
  [user, db])

  const { data: rides, isLoading } = useCollection(ridesQuery)

  const activeRide = useMemo(() => {
    return rides?.find(r => !['Completed', 'Paid', 'Cancelled', 'Rejected'].includes(r.status))
  }, [rides])

  useEffect(() => {
    if (activeRide) {
      setIsTripActive(true)
    } else {
      setIsTripActive(false)
    }
  }, [activeRide])

  const earnings = useMemo(() => {
    if (!rides) return { daily: 0, weekly: 0, monthly: 0, total: 0 }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    const weekTimestamp = startOfWeek.getTime()

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return rides.reduce((acc, ride) => {
      if (ride.status !== 'Completed' && ride.status !== 'Paid') return acc
      
      const rideDate = ride.createdAt?.toDate ? ride.createdAt.toDate().getTime() : (ride.createdAt?.seconds ? ride.createdAt.seconds * 1000 : 0)
      const fare = Number(ride.fare) || 0

      acc.total += fare
      if (rideDate >= today) acc.daily += fare
      if (rideDate >= weekTimestamp) acc.weekly += fare
      if (rideDate >= startOfMonth) acc.monthly += fare

      return acc
    }, { daily: 0, weekly: 0, monthly: 0, total: 0 })
  }, [rides])

  return (
    <div className="min-h-screen bg-charcoal text-foreground p-4 pb-24 font-body overflow-x-hidden">
      <div className="command-grid-overlay opacity-30" />
      
      {/* Driver Header */}
      <header className="flex items-center justify-between mb-8 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl ring-2 ring-orange/40 overflow-hidden shadow-2xl">
            <img src={`https://picsum.photos/seed/${user?.uid}/200/200`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-black text-lg uppercase tracking-tighter">{profile?.name || "Operator Hunt"}</h1>
            <div className="flex items-center gap-2 text-orange text-[10px] font-black uppercase tracking-widest">
              <Star className="w-3 h-3 fill-orange" />
              {profile?.rating ? profile.rating.toFixed(1) : '5.0'} Safety Score
            </div>
          </div>
        </div>
        <Badge className="bg-orange text-white border-none font-black uppercase text-[10px] px-3 py-1">Nexus Verified</Badge>
      </header>

      {activeTab === 'trip' ? (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="z-10 relative space-y-8"
        >
          {/* Main Action Card */}
          <Card className={cn(
            "glass-panel border-none relative overflow-hidden transition-all duration-500",
            isTripActive ? "ring-2 ring-active shadow-[0_0_40px_rgba(0,255,102,0.1)]" : "shadow-2xl"
          )}>
            <CardContent className="p-8">
              {!isTripActive ? (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-navy/40 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                    <Play className="w-10 h-10 text-orange drop-shadow-[0_0_10px_rgba(255,128,0,0.5)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Initialize Shift?</h2>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-2">Protocol compliance required before ignition</p>
                  </div>
                  <Button 
                    onClick={() => setIsTripActive(true)}
                    className="w-full bg-orange hover:bg-orange/90 text-white font-black h-16 rounded-2xl text-lg uppercase tracking-wider shadow-lg shadow-orange/20"
                  >
                    Confirm Readiness
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 bg-active rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,102,0.8)]" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-active block">Mission Active</span>
                        <span className="text-[9px] font-mono text-white/40">ID: {activeRide?.id.substring(0,8).toUpperCase()}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-mono font-black text-white tracking-tighter">
                      {activeRide?.createdAt?.toDate ? 
                        new Date(new Date().getTime() - activeRide.createdAt.toDate().getTime()).toISOString().substr(11, 8) 
                        : '00:00:00'}
                    </span>
                  </div>

                  <div className="p-6 bg-navy/40 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-orange/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-orange" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-white/40 font-black tracking-widest">Vector Target</p>
                        <p className="text-sm font-black text-white mt-1">{activeRide?.dropoff?.address || "Calibrating..."}</p>
                        <p className="text-[9px] font-bold text-orange uppercase mt-0.5">ESTIMATED TRANSIT</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-3 tracking-widest">
                          <span className="text-white/40">Transmission Hub Lock</span>
                          <span className="text-active">72%</span>
                        </div>
                        <Progress value={72} className="h-2 bg-navy/60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-14 border-white/10 bg-white/5 text-[10px] uppercase font-black tracking-widest hover:bg-white/10">
                      <Camera className="w-4 h-4 mr-2" /> 
                      Log Exception
                    </Button>
                    <Button variant="outline" className="h-14 border-white/10 bg-white/5 text-[10px] uppercase font-black tracking-widest hover:bg-white/10">
                      <Fuel className="w-4 h-4 mr-2 text-orange" /> 
                      Fuel Scan
                    </Button>
                  </div>

                  <Button 
                    onClick={() => setIsTripActive(false)}
                    className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-wider bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Square className="w-5 h-5 mr-3 fill-current" />
                    Terminate Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="z-10 relative space-y-6"
        >
          {/* Earnings Metrics */}
          <div className="grid grid-cols-1 gap-3">
             <Card className="glass-panel border-none p-5 bg-navy/20 flex items-center justify-between shadow-xl">
                <div>
                   <p className="text-[10px] font-black uppercase text-white/40 mb-1 tracking-widest">Tactical Credits (MTD)</p>
                   <p className="text-3xl font-black text-active">₹{earnings.monthly}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-active opacity-20" />
             </Card>
             
             <div className="grid grid-cols-2 gap-3">
                <Card className="glass-panel border-none p-4 bg-navy/20 shadow-lg">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1 tracking-widest">Today</p>
                    <p className="text-lg font-black text-white">₹{earnings.daily}</p>
                </Card>
                <Card className="glass-panel border-none p-4 bg-navy/20 shadow-lg">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1 tracking-widest">Weekly</p>
                    <p className="text-lg font-black text-orange">₹{earnings.weekly}</p>
                </Card>
             </div>
          </div>

          <Button 
            onClick={() => setIsPayslipOpen(true)}
            variant="outline" 
            className="w-full h-14 border-dashed border-white/20 bg-white/5 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all rounded-2xl"
          >
            <FileText className="w-5 h-5 mr-3 text-orange" /> Generate Monthly Manifest
          </Button>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Payout Log</h3>
              <ArrowRight className="w-4 h-4 text-white/20" />
            </div>
            <div className="space-y-3">
              {rides && rides.length > 0 ? (
                rides.slice(0, 8).map((ride: any) => (
                  <div key={ride.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5 bg-navy/20 active:bg-navy/30 transition-all cursor-pointer shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-navy/40 flex items-center justify-center border border-white/5 shrink-0">
                        <Wallet className="w-4 h-4 text-orange" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-white tracking-widest truncate">Mission: {ride.id.substring(0,8)}</p>
                        <p className="text-[8px] text-white/40 font-bold uppercase mt-1">
                          {ride.createdAt?.toDate ? ride.createdAt.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Syncing...'} • ₹{ride.fare}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 border-none shrink-0",
                      ride.status === 'Completed' || ride.status === 'Paid' ? 'bg-active/10 text-active' : 'bg-orange/10 text-orange'
                    )}>
                      {ride.status === 'Paid' ? 'Audited' : 'Verified'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-navy/20 rounded-2xl border border-dashed border-white/10">
                  <p className="text-[9px] font-black uppercase text-white/20">No missions logged</p>
                </div>
              )}
            </div>
          </section>
        </motion.div>
      )}

      {/* Payslip Dialog */}
      <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
               <FileText className="w-5 h-5 text-orange" />
               Nexus Earning Manifest
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
               Official earnings breakdown for active deployment cycle.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6 border-y border-white/5 my-4">
             <div className="space-y-4">
                <div className="flex justify-between items-center bg-navy/20 p-4 rounded-xl">
                   <div>
                      <p className="text-[8px] font-black uppercase text-white/40">Gross Deployments</p>
                      <p className="text-xl font-black text-white">{earnings.monthly} <span className="text-[10px] text-orange">INR</span></p>
                   </div>
                   <Wallet className="w-8 h-8 text-orange opacity-20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-navy/20 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-white/40">Service Tax</p>
                      <p className="text-sm font-black text-white/60">₹0.00</p>
                   </div>
                   <div className="p-4 bg-navy/20 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-white/40">Nexus Fee</p>
                      <p className="text-sm font-black text-white/60">₹0.00</p>
                   </div>
                </div>

                <div className="p-6 bg-active/10 border border-active/20 rounded-2xl text-center">
                   <p className="text-[10px] font-black uppercase text-active tracking-[0.2em] mb-2">Net Payout Authorized</p>
                   <p className="text-4xl font-black text-active tracking-tighter">₹{earnings.monthly}</p>
                </div>
             </div>

             <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between text-[9px] font-black uppercase">
                   <span className="text-white/40 tracking-widest">Operator</span>
                   <span className="text-white">{profile?.name}</span>
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase">
                   <span className="text-white/40 tracking-widest">Sector ID</span>
                   <span className="text-white font-mono">{user?.uid.substring(0,10)}</span>
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase">
                   <span className="text-white/40 tracking-widest">Cycle Date</span>
                   <span className="text-white">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </div>
             </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPayslipOpen(false)} className="text-[10px] font-black uppercase text-white/40">Close Terminal</Button>
            <Button className="bg-orange text-white font-black uppercase text-[10px] h-10 px-6 shadow-lg shadow-orange/20">
               <Download className="w-4 h-4 mr-2" /> Download Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-panel border-t border-white/10 z-50 flex items-center justify-around px-6 backdrop-blur-2xl">
        <button 
          onClick={() => setActiveTab('trip')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'trip' ? "text-orange scale-110" : "text-white/30")}
        >
          <Play className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Trip</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-all">
          <MapPin className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Routes</span>
        </button>
        <button 
          onClick={() => setActiveTab('payout')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'payout' ? "text-orange scale-110" : "text-white/30")}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Payout</span>
        </button>
        <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-all">
          <User className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Identity</span>
        </Link>
      </nav>

    </div>
  )
}
