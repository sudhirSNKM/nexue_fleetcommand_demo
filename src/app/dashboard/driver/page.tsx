
"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import { Navigation, Power, AlertCircle, Phone, MessageSquare, Star, Truck, BarChart3, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, serverTimestamp, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from "recharts"

export default function DriverApp() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const todayDate = new Date().toISOString().split('T')[0]
  const statsId = `${user?.uid}_${todayDate}`

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)
  const isOnline = profile?.status === "Online"

  const statsRef = useMemoFirebase(() => user && db ? doc(db, "driverStats", statsId) : null, [user, db, statsId])
  const { data: dailyStats } = useDoc(statsRef)

  const pendingQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), where("status", "==", "Requested")) : null, [db])
  const { data: pendingRides } = useCollection(pendingQuery)

  const activeQuery = useMemoFirebase(() => user && db ? query(collection(db, "rides"), where("driverId", "==", user.uid), where("status", "in", ["Accepted", "Arrived", "InProgress"])) : null, [user, db])
  const { data: activeRides } = useCollection(activeQuery)

  useEffect(() => {
    gsap.from(".driver-widget", { scale: 0.9, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" })
  }, [])

  const handleToggleOnline = () => {
    if (!profileRef) return
    updateDocumentNonBlocking(profileRef, { status: isOnline ? "Offline" : "Online" })
  }

  const handleAcceptRide = (rideId: string) => {
    if (!user || !db) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { driverId: user.uid, status: "Accepted", acceptedAt: serverTimestamp() })
    toast({ title: "Mission Accepted", description: "Tactical route generated. Proceed to pickup." })
  }

  const handleUpdateStatus = (rideId: string, nextStatus: string, fare?: number) => {
    if (!db || !user) return
    const rideRef = doc(db, "rides", rideId)
    if (nextStatus === "Completed") {
      updateDocumentNonBlocking(rideRef, { status: "Completed", endTime: serverTimestamp() })
      if (statsRef) setDocumentNonBlocking(statsRef, { driverId: user.uid, date: todayDate, earnings: increment(fare || 0), rideCount: increment(1) }, { merge: true })
      toast({ title: "Mission Finalized", description: `Credits logged: ₹${fare}` })
    } else {
      updateDocumentNonBlocking(rideRef, { status: nextStatus })
    }
  }

  const activeRide = activeRides?.[0]
  const mockChartData = [
    { hour: '08:00', val: 120 }, { hour: '10:00', val: 450 }, { hour: '12:00', val: 320 }, 
    { hour: '14:00', val: 680 }, { hour: '16:00', val: 150 }, { hour: '18:00', val: 540 }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full p-2">
      <div className="lg:col-span-3 relative h-[400px] lg:h-full rounded-2xl overflow-hidden border border-navy shadow-2xl">
        <TacticalMap markers={activeRide ? [
          { id: 'p', lat: activeRide.pickup.lat, lng: activeRide.pickup.lng, label: 'Pickup', type: 'pickup' },
          { id: 'd', lat: activeRide.dropoff.lat, lng: activeRide.dropoff.lng, label: 'Dropoff', type: 'dropoff' }
        ] : []} />
      </div>

      <div className="space-y-6">
        <Card className="glass-panel driver-widget border-b-4 border-orange">
          <CardHeader className="p-4 bg-navy/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Operator Terminal</CardTitle>
            <Button onClick={handleToggleOnline} size="sm" className={isOnline ? "bg-active text-black hover:bg-active/90" : "bg-muted text-white"}>
              <Power className="w-4 h-4 mr-2" /> {isOnline ? "ONLINE" : "OFFLINE"}
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <AnimatePresence mode="wait">
              {activeRide ? (
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-orange/20 text-orange mb-1 uppercase text-[8px] font-black">{activeRide.serviceType} MODE</Badge>
                      <h3 className="text-sm font-black uppercase truncate max-w-[150px] text-white">{activeRide.pickup.address}</h3>
                    </div>
                    <p className="text-lg font-black text-active">₹{activeRide.fare}</p>
                  </div>
                  {activeRide.status === "Accepted" && <Button onClick={() => handleUpdateStatus(activeRide.id, "Arrived")} className="w-full bg-orange text-white h-12 font-black uppercase text-xs">Arrived at Origin</Button>}
                  {activeRide.status === "Arrived" && <Button onClick={() => handleUpdateStatus(activeRide.id, "InProgress")} className="w-full bg-active text-black h-12 font-black uppercase text-xs">Initialize Mission</Button>}
                  {activeRide.status === "InProgress" && <Button onClick={() => handleUpdateStatus(activeRide.id, "Completed", activeRide.fare)} className="w-full bg-emergency text-white h-12 font-black uppercase text-xs">Finalize Mission</Button>}
                </motion.div>
              ) : isOnline ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-active/30 border-t-active animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase text-active">Scanning Sector...</p>
                  {pendingRides?.map(ride => (
                    <Card key={ride.id} className="bg-navy/20 border-orange/20 p-3 text-left">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black text-orange uppercase">{ride.vehicleType}</span>
                        <span className="text-xs font-black text-white">₹{ride.fare}</span>
                      </div>
                      <Button onClick={() => handleAcceptRide(ride.id)} className="w-full bg-orange text-white h-8 text-[10px] font-black uppercase">Accept</Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-40">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 text-white" />
                  <p className="text-[10px] font-black uppercase text-white">Go online to receive missions</p>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="glass-panel driver-widget">
          <CardHeader className="p-3 border-b border-navy/20">
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-white/70">
              <TrendingUp className="w-3 h-3 text-active" /> Activity Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={8} stroke="#ffffff" opacity={0.5} />
                <Tooltip contentStyle={{ background: '#131518', border: 'none', fontSize: '10px', color: '#fff' }} />
                <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                  {mockChartData.map((e, i) => <Cell key={i} fill={e.val > 500 ? '#00CC00' : '#FF8000'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-panel driver-widget p-4">
            <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Total Earnings</p>
            <h4 className="text-xl font-black text-white">₹{dailyStats?.earnings || 0}</h4>
          </Card>
          <Card className="glass-panel driver-widget p-4">
            <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Missions</p>
            <h4 className="text-xl font-black text-white">{dailyStats?.rideCount || 0}</h4>
          </Card>
        </div>
      </div>
    </div>
  )
}
