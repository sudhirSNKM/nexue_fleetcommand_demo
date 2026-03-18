"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Download,
  Wallet,
  DollarSign,
  History,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc, limit, orderBy } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function DriverEarningsTerminal() {
  const { user } = useUser()
  const db = useFirestore()
  const [isPayslipOpen, setIsPayslipOpen] = useState(false)

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)

  const ridesQuery = useMemoFirebase(() => 
    user && db ? query(
      collection(db, "rides"),
      where("driverId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    ) : null, 
  [user, db])

  const { data: rides, isLoading } = useCollection(ridesQuery)

  const earnings = useMemo(() => {
    if (!rides) return { daily: 0, weekly: 0, monthly: 0, total: 0, count: 0 }
    
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
      acc.count += 1
      if (rideDate >= today) acc.daily += fare
      if (rideDate >= weekTimestamp) acc.weekly += fare
      if (rideDate >= startOfMonth) acc.monthly += fare

      return acc
    }, { daily: 0, weekly: 0, monthly: 0, total: 0, count: 0 })
  }, [rides])

  const chartData = useMemo(() => {
    if (!rides) return []
    // Group last 7 days for desktop chart
    const groups: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      groups[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0
    }

    rides.forEach(r => {
      if (r.status === 'Completed' || r.status === 'Paid') {
        const d = r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : null)
        if (d) {
          const key = d.toLocaleDateString('en-US', { weekday: 'short' })
          if (groups[key] !== undefined) groups[key] += Number(r.fare) || 0
        }
      }
    })

    return Object.entries(groups).map(([day, val]) => ({ day, earnings: val }))
  }, [rides])

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Terminal Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-slate-900">
             <DollarSign className="w-10 h-10 text-orange" />
             Earnings Terminal
          </h1>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 mt-2">
            Strategic Credit & Settlement Audit
          </p>
        </div>
        
        <div className="flex gap-4">
           <Button 
            onClick={() => setIsPayslipOpen(true)}
            className="bg-orange hover:bg-orange/90 text-white font-black uppercase text-xs h-12 px-8 shadow-lg shadow-orange/20 border-none"
          >
             <FileText className="w-4 h-4 mr-2" /> Generate Monthly Manifest
           </Button>
        </div>
      </section>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Daily Pulse", val: earnings.daily, icon: Zap, color: "text-slate-900", sub: "Today's Yield" },
           { label: "Weekly Loop", val: earnings.weekly, icon: Clock, color: "text-orange", sub: "Mon - Sun Cycle" },
           { label: "Monthly Goal", val: earnings.monthly, icon: TrendingUp, color: "text-green-600", sub: "Operational Payout" },
           { label: "Total Missions", val: earnings.count, icon: ShieldCheck, color: "text-slate-400", sub: "Archive Count" },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-xl bg-white overflow-hidden group">
             <CardContent className="p-6 relative">
                <stat.icon className={cn("absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity", stat.color)} />
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
                <h4 className={cn("text-2xl font-black", stat.color)}>
                  {typeof stat.val === 'number' && stat.label !== "Total Missions" ? `₹${stat.val}` : stat.val}
                </h4>
                <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">{stat.sub}</p>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Earnings Chart */}
         <Card className="xl:col-span-2 border-none shadow-xl bg-white">
            <CardHeader className="p-6 border-b border-slate-50">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-orange" /> Performance Visualizer
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Recent Payout Log */}
         <Card className="border-none shadow-xl bg-white">
            <CardHeader className="p-6 border-b border-slate-50">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <History className="w-4 h-4 text-slate-400" /> Recent Payout Records
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {rides && rides.length > 0 ? (
                    rides.slice(0, 10).map((ride: any) => (
                      <div key={ride.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-orange" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">ID: {ride.id.substring(0,8)}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                {ride.createdAt?.toDate ? ride.createdAt.toDate().toLocaleDateString() : 'Syncing...'}
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-slate-900">₹{ride.fare}</p>
                           <Badge variant="outline" className="text-[7px] font-black uppercase border-green-200 text-green-600 bg-green-50">Audited</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-slate-300">
                       <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                       <p className="text-[9px] font-black uppercase">Archive Empty</p>
                    </div>
                  )}
               </div>
               <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                  <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-slate-400">View Full Archive</Button>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Monthly Manifest (Payslip) Dialog */}
      <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
        <DialogContent className="max-w-2xl bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-32 h-32" />
             </div>
             <div className="flex justify-between items-start relative z-10">
                <div>
                   <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-6 h-6 text-orange fill-orange" />
                      <span className="font-black text-xl tracking-tighter">Fleet<span className="text-orange">OS</span></span>
                   </div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Earnings Manifest</h2>
                   <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.4em] mt-1">Official Tactical Payout Record</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-orange uppercase tracking-widest mb-1">Issue Date</p>
                   <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
                </div>
             </div>
          </div>
          
          <div className="p-8 space-y-8">
             <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 tracking-[0.2em]">Partner Compliance</p>
                   <div>
                      <p className="text-xs font-black uppercase text-slate-800">{profile?.name || "Operator"}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">UUID: {user?.uid}</p>
                      <Badge className="mt-2 bg-orange/10 text-orange border-none uppercase text-[8px] font-black">{profile?.role}</Badge>
                   </div>
                </div>
                <div className="space-y-4 text-right">
                   <p className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 tracking-[0.2em]">Operational Sector</p>
                   <div>
                      <p className="text-xs font-black uppercase text-slate-800">{profile?.zone || "Central Hub"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Deployment Cycle: {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                   <table className="w-full">
                      <tbody className="divide-y divide-slate-200">
                         <tr>
                            <td className="py-3 text-[10px] font-black uppercase text-slate-500">Gross Mission Credits</td>
                            <td className="py-3 text-right font-black text-slate-900">₹{earnings.monthly}</td>
                         </tr>
                         <tr>
                            <td className="py-3 text-[10px] font-black uppercase text-slate-500">Network Platform Fee (0%)</td>
                            <td className="py-3 text-right font-black text-slate-900">₹0.00</td>
                         </tr>
                         <tr className="border-t-2 border-slate-900">
                            <td className="pt-6 text-xs font-black uppercase text-slate-900">Net Tactical Payout</td>
                            <td className="pt-6 text-right text-2xl font-black text-orange">₹{earnings.monthly}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 bg-orange/5 rounded-xl border border-orange/10">
                <ShieldCheck className="w-5 h-5 text-orange" />
                <p className="text-[10px] font-medium text-orange uppercase tracking-wider leading-relaxed">
                   This manifest constitutes an official record of mission-based earnings for the specified cycle. Platform settlement protocol: Instant Transfer.
                </p>
             </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 gap-4">
            <Button variant="ghost" onClick={() => setIsPayslipOpen(false)} className="text-[10px] font-black uppercase text-slate-400">Discard Term</Button>
            <Button className="bg-slate-900 text-white font-black uppercase text-[10px] h-12 px-8 shadow-xl">
               <Download className="w-4 h-4 mr-2" /> Download Auth Record (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
