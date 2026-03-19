
"use client"

import React, { useState } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Navigation, Power, AlertCircle, Phone, Star, TrendingUp, QrCode, Banknote, CheckCircle2, ArrowRight, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, serverTimestamp, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from "recharts"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DriverApp() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [showUPI, setShowUPI] = useState(false)

  const todayDate = new Date().toISOString().split('T')[0]
  const statsId = `${user?.uid}_${todayDate}`

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)
  const isOnline = profile?.status === "Online"

  const statsRef = useMemoFirebase(() => user && db ? doc(db, "driverStats", statsId) : null, [user, db, statsId])
  const { data: dailyStats } = useDoc(statsRef)

  const pendingQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), where("status", "==", "Requested")) : null, [db])
  const { data: pendingRides } = useCollection(pendingQuery)

  const activeQuery = useMemoFirebase(() => user && db ? query(collection(db, "rides"), where("driverId", "==", user.uid), where("status", "in", ["Accepted", "Arrived", "InProgress", "Completed"])) : null, [user, db])
  const { data: activeRides } = useCollection(activeQuery)

  const activeRide = activeRides?.[0]

  // Fetch Passenger Profile for Active Ride
  const passengerRef = useMemoFirebase(() => activeRide?.passengerId && db ? doc(db, "userProfiles", activeRide.passengerId) : null, [activeRide?.passengerId, db])
  const { data: passengerProfile } = useDoc(passengerRef)

  const handleToggleOnline = () => {
    if (!profileRef) return
    updateDocumentNonBlocking(profileRef, { status: isOnline ? "Offline" : "Online" })
  }

  const handleAcceptRide = (rideId: string) => {
    if (!user || !db) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { driverId: user.uid, status: "Accepted", acceptedAt: serverTimestamp() })
    toast({ title: "Mission Accepted", description: "Proceed to pickup point immediately." })
  }

  const handleRejectRide = (rideId: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { status: "Rejected", rejectedAt: serverTimestamp() })
    toast({ variant: "destructive", title: "Mission Declined", description: "Request cleared from operator terminal." })
  }

  const handleUpdateStatus = (rideId: string, nextStatus: string) => {
    if (!db) return
    const rideRef = doc(db, "rides", rideId)
    updateDocumentNonBlocking(rideRef, { status: nextStatus })
    if (nextStatus === "Completed") {
      toast({ title: "Destination Reached", description: "End trip successful. Awaiting settlement." })
    }
  }

  const handleCompletePayment = (rideId: string, method: string, fare: number) => {
    if (!db || !user) return
    const rideRef = doc(db, "rides", rideId)
    
    updateDocumentNonBlocking(rideRef, { 
      status: "Paid", 
      paymentMethod: method,
      paidAt: serverTimestamp() 
    })

    if (statsRef) {
      setDocumentNonBlocking(statsRef, { 
        driverId: user.uid, 
        date: todayDate, 
        earnings: increment(fare || 0), 
        rideCount: increment(1) 
      }, { merge: true })
    }

    setShowUPI(false)
    toast({ 
      title: "Settlement Successful", 
      description: `₹${fare} credits logged via ${method}. Mission archived.` 
    })
  }

  const mockChartData = [
    { hour: '08:00', val: 120 }, { hour: '10:00', val: 450 }, { hour: '12:00', val: 320 }, 
    { hour: '14:00', val: 680 }, { hour: '16:00', val: 150 }, { hour: '18:00', val: 540 }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full text-slate-900">
      <div className="lg:col-span-3 relative h-[250px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 bg-white">
        <TacticalMap markers={activeRide ? [
          { id: 'p', lat: activeRide.pickup.lat, lng: activeRide.pickup.lng, label: 'Pickup', type: 'pickup' },
          { id: 'd', lat: activeRide.dropoff.lat, lng: activeRide.dropoff.lng, label: 'Dropoff', type: 'dropoff' }
        ] : []} />
      </div>

      <div className="space-y-6 relative z-50">
        <Card className="border-none shadow-xl bg-white/95 backdrop-blur-md">
          <CardHeader className="p-4 bg-slate-50 flex flex-row items-center justify-between rounded-t-2xl border-b border-slate-100">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">Operator Terminal</CardTitle>
            <Button onClick={handleToggleOnline} size="sm" className={cn("border-none", isOnline ? "bg-green-500 text-white hover:bg-green-600" : "bg-slate-200 text-slate-600")}>
              <Power className="w-3 h-3 mr-2" /> {isOnline ? "ONLINE" : "OFFLINE"}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {activeRide ? (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-orange/10 text-orange mb-1 uppercase text-[8px] font-black border-none">{activeRide.serviceType} PROTOCOL</Badge>
                      <h3 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{activeRide.pickup.address}</h3>
                    </div>
                    <p className="text-lg font-black text-slate-900">₹{activeRide.fare}</p>
                  </div>

                  {/* Passenger Comms Link */}
                  {passengerProfile && (activeRide.status === "Accepted" || activeRide.status === "Arrived" || activeRide.status === "InProgress") && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-navy" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Client Contact</p>
                            <p className="text-xs font-black text-slate-900 uppercase">{passengerProfile.name}</p>
                          </div>
                        </div>
                        <Button asChild size="icon" className="rounded-full bg-active hover:bg-active/90 shadow-lg border-none">
                          <a href={`tel:${passengerProfile.phone}`}>
                            <Phone className="w-4 h-4 text-white" />
                          </a>
                        </Button>
                      </div>

                      {activeRide.serviceType === 'Parcel' && (
                        <div className="grid grid-cols-2 gap-2">
                           <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Phone className="w-2 h-2 text-orange" /> Picker Number
                              </p>
                              <p className="text-[10px] font-black text-slate-900">{activeRide.pickupPhone || 'Not Mentioned'}</p>
                           </div>
                           <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Phone className="w-2 h-2 text-orange" /> Drop Point
                              </p>
                              <p className="text-[10px] font-black text-slate-900">{activeRide.dropoffPhone || 'Not Mentioned'}</p>
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeRide.status === "Accepted" && (
                    <Button onClick={() => handleUpdateStatus(activeRide.id, "Arrived")} className="w-full bg-orange text-white h-12 font-black uppercase text-xs shadow-lg border-none">Arrived at Origin</Button>
                  )}
                  {activeRide.status === "Arrived" && (
                    <Button onClick={() => handleUpdateStatus(activeRide.id, "InProgress")} className="w-full bg-slate-900 text-white h-12 font-black uppercase text-xs shadow-lg border-none">Start Trip</Button>
                  )}
                  {activeRide.status === "InProgress" && (
                    <Button onClick={() => handleUpdateStatus(activeRide.id, "Completed")} className="w-full bg-red-600 text-white h-12 font-black uppercase text-xs shadow-lg border-none">End Trip</Button>
                  )}

                  {activeRide.status === "Completed" && (
                    <div className="space-y-4 pt-2">
                      <div className="p-4 bg-slate-100 rounded-xl text-center border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Awaiting Settlement</p>
                        <p className="text-2xl font-black text-slate-900">₹{activeRide.fare}</p>
                      </div>

                      {showUPI ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                          <div className="w-32 h-32 bg-white border-2 border-slate-900 mx-auto rounded-xl flex items-center justify-center p-2 shadow-xl">
                            <QrCode className="w-full h-full text-slate-900" />
                          </div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Scan to pay operator</p>
                          <div className="grid grid-cols-2 gap-2">
                             <Button onClick={() => setShowUPI(false)} variant="outline" className="text-[10px] font-black uppercase border-slate-200">Cancel</Button>
                             <Button onClick={() => handleCompletePayment(activeRide.id, "Online", activeRide.fare)} className="bg-active text-white text-[10px] font-black uppercase shadow-lg border-none">Paid Online</Button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={() => handleCompletePayment(activeRide.id, "Cash", activeRide.fare)} variant="outline" className="h-14 border-slate-900 flex flex-col items-center justify-center gap-1 group shadow-sm">
                            <Banknote className="w-5 h-5 text-slate-900 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase">Cash Settlement</span>
                          </Button>
                          <Button onClick={() => setShowUPI(true)} className="h-14 bg-orange text-white flex flex-col items-center justify-center gap-1 group shadow-lg border-none">
                            <QrCode className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase">UPI / QR Link</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : isOnline ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-10 h-10 rounded-full border-4 border-orange/10 border-t-orange animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Scanning sector for missions...</p>
                  <div className="space-y-4">
                    {pendingRides?.slice(0, 3).map(ride => (
                      <Card key={ride.id} className="bg-slate-50 border-slate-100 p-4 text-left shadow-md">
                        <div className="flex justify-between items-center mb-3">
                          <Badge className="bg-slate-900 text-white text-[8px] font-black uppercase border-none">{ride.vehicleType}</Badge>
                          <span className="text-sm font-black text-slate-900">₹{ride.fare}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 truncate">{ride.pickup.address}</p>
                        
                        <div className="space-y-2">
                          <SwipeToAccept onAccept={() => handleAcceptRide(ride.id)} />
                          
                          <Button 
                            variant="ghost" 
                            onClick={() => handleRejectRide(ride.id)}
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-black uppercase h-8"
                          >
                            <X className="w-3 h-3 mr-1" /> Decline Mission
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {!pendingRides?.length && (
                      <div className="py-8 opacity-20">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-[8px] font-black uppercase">No active broadcasts</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 opacity-40">
                  <AlertCircle className="w-10 h-10 mx-auto mb-4 text-slate-400" />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Connect to network for missions</p>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-slate-500">
              <TrendingUp className="w-3 h-3 text-green-500" /> Performance Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={8} stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', fontSize: '10px' }} />
                <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                  {mockChartData.map((e, i) => <Cell key={i} fill={e.val > 500 ? '#22c55e' : '#f97316'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center border-none shadow-md bg-white hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => router.push('/dashboard/driver/earnings')}>
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1 flex items-center justify-center gap-1 group-hover:text-orange">
              Total Earnings <ArrowRight className="w-2 h-2" />
            </p>
            <h4 className="text-xl font-black text-slate-900 group-hover:text-orange">₹{dailyStats?.earnings || 0}</h4>
          </Card>
          <Card className="p-4 text-center border-none shadow-md bg-white">
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1">Missions</p>
            <h4 className="text-xl font-black text-slate-900">{dailyStats?.rideCount || 0}</h4>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SwipeToAccept({ onAccept }: { onAccept: () => void }) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [0, 150], [1, 0])
  const textOpacity = useTransform(x, [0, 50], [1, 0])

  return (
    <div className="relative h-12 bg-slate-100 rounded-full border border-slate-200 overflow-hidden group">
      <motion.div style={{ opacity: textOpacity }} className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Accept Mission <ArrowRight className="w-3 h-3 animate-pulse" />
        </span>
      </motion.div>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 150) {
            onAccept()
          } else {
            x.set(0)
          }
        }}
        className="absolute left-1 top-1 w-10 h-10 bg-orange rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10"
      >
        <CheckCircle2 className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  )
}
