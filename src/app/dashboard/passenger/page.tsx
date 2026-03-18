"use client"

import React, { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MapPin, Navigation, Car, Bike, Zap, Package, Truck, ShieldAlert, Star, Phone, QrCode, Banknote, CheckCircle2, Clock, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, doc, limit, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const SERVICES = [
  { id: 'Ride', name: 'Ride', icon: Car, vehicles: [
    { id: 'Bike', name: 'Bike', icon: Bike, rate: 12, min: 35 },
    { id: 'Auto', name: 'Auto', icon: Zap, rate: 18, min: 55 },
    { id: 'Cab', name: 'Cab', icon: Car, rate: 28, min: 90 }
  ]},
  { id: 'Parcel', name: 'Parcel', icon: Package, vehicles: [
    { id: 'Bike', name: 'Runner', icon: Bike, rate: 15, min: 40 },
    { id: 'Auto', name: 'Porter', icon: Zap, rate: 22, min: 65 }
  ]},
  { id: 'Logistics', name: 'Logistics', icon: Truck, vehicles: [
    { id: 'TataAce', name: 'Mini Truck', icon: Truck, rate: 45, min: 250 },
    { id: 'Pickup', name: 'Pickup', icon: Truck, rate: 65, min: 450 },
    { id: 'Lorry', name: 'Lorry', icon: Truck, rate: 120, min: 1200 }
  ]}
]

export default function PassengerApp() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeService, setActiveService] = useState('Ride')
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState('Bike')
  const [payingOnline, setPayingOnline] = useState(false)
  const [scanTimer, setScanTimer] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  
  const hasLocations = pickup.trim().length > 2 && dropoff.trim().length > 2
  const mockDistance = useMemo(() => hasLocations ? Math.floor(Math.random() * 8) + 2 : 0, [hasLocations, pickup, dropoff])

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)

  const activeRidesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "rides"), 
      where("passengerId", "==", user.uid),
      limit(10)
    )
  }, [user, db])

  const { data: activeRides } = useCollection(activeRidesQuery)
  
  const currentRide = useMemo(() => {
    if (!activeRides) return null
    const liveStatuses = ["Requested", "Accepted", "Arrived", "InProgress", "Completed", "Paid", "Rejected"]
    const sorted = [...activeRides].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
    return sorted.find(r => liveStatuses.includes(r.status))
  }, [activeRides])

  // Mission Notifications Effect
  useEffect(() => {
    if (!currentRide?.status) return;

    if (currentRide.status === "Rejected") {
      const timer = setTimeout(() => {
        toast({ 
          title: "Operator Busy", 
          description: "Applying ₹20 surge for priority re-broadcast...",
          variant: "destructive" 
        })
        const rideRef = doc(db, "rides", currentRide.id)
        updateDocumentNonBlocking(rideRef, {
          status: "Requested",
          fare: increment(20),
          lastRejectedAt: serverTimestamp()
        })
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentRide?.status, currentRide?.id, db, toast]);

  // Mission Timeout Logic (1 Minute)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentRide?.status === "Requested") {
      if (scanTimer === null) setScanTimer(60)
      interval = setInterval(() => {
        setScanTimer((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(interval)
            handleCancelRide(currentRide.id)
            setTimeout(() => {
              toast({ 
                title: "Mission Timeout", 
                description: "No units responded within the tactical window.",
                variant: "destructive"
              })
            }, 0)
            return 0
          }
          return prev !== null ? prev - 1 : null
        })
      }, 1000)
    } else {
      setScanTimer(null)
    }
    return () => clearInterval(interval)
  }, [currentRide?.status, currentRide?.id])

  const driverProfileRef = useMemoFirebase(() => currentRide?.driverId && db ? doc(db, "userProfiles", currentRide.driverId) : null, [currentRide?.driverId, db])
  const { data: driverProfile } = useDoc(driverProfileRef)

  const currentFare = useMemo(() => {
    const service = SERVICES.find(s => s.id === activeService)
    const vehicle = service?.vehicles.find(v => v.id === selectedVehicle)
    if (!vehicle || !hasLocations) return 0
    return Math.max(vehicle.min, mockDistance * vehicle.rate)
  }, [activeService, selectedVehicle, mockDistance, hasLocations])

  const handleBookRide = async () => {
    if (!user || !db) return
    addDoc(collection(db, "rides"), {
      passengerId: user.uid,
      serviceType: activeService,
      vehicleType: selectedVehicle,
      pickup: { address: pickup, lat: 12.9716, lng: 77.5946 },
      dropoff: { address: dropoff, lat: 12.8452, lng: 77.6632 },
      status: "Requested",
      distance: mockDistance,
      fare: currentFare,
      createdAt: serverTimestamp()
    })
    setTimeout(() => {
      toast({ title: "Broadcast Initiated", description: "Scanning sector for available units." })
    }, 0)
  }

  const handleCancelRide = (rideId: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { status: "Cancelled", cancelledAt: serverTimestamp() })
  }

  const handleSubmitReview = (rideId: string) => {
    if (!db || !rating) return
    const rideRef = doc(db, "rides", rideId)
    updateDocumentNonBlocking(rideRef, { rating, reviewedAt: serverTimestamp() })
    setReviewSubmitted(true)
    setTimeout(() => {
      toast({ title: "Review Logged", description: "Tactical performance updated." })
    }, 0)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full text-slate-900">
      <div className="lg:col-span-2 relative h-[400px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <TacticalMap 
          markers={currentRide || hasLocations ? [
            { id: 'p', lat: 12.9716, lng: 77.5946, label: 'Origin', type: 'pickup' },
            { id: 'd', lat: 12.8452, lng: 77.6632, label: 'Target', type: 'dropoff' }
          ] : []}
        />
      </div>

      <div className="space-y-6 relative z-50">
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-md">
          <CardHeader className="pb-2">
            {!currentRide && (
              <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
                <TabsList className="grid grid-cols-3 bg-slate-900 p-1.5 h-16 rounded-xl shadow-inner">
                  {SERVICES.map(s => (
                    <TabsTrigger 
                      key={s.id} 
                      value={s.id} 
                      className="data-[state=active]:bg-orange data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex flex-col items-center justify-center gap-1 py-1 h-full text-white font-black"
                    >
                      <s.icon className="w-5 h-5 mb-0.5" /> 
                      <span className="text-[9px] uppercase tracking-tighter font-black">
                        {s.name}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <CardTitle className="text-lg font-black uppercase tracking-tighter mt-4 text-slate-900 text-center border-b border-slate-100 pb-3">
              {currentRide ? (currentRide.status === "Completed" || currentRide.status === "Paid" ? "Mission Finalization" : `${currentRide.serviceType} Terminal`) : "Initialize Mission"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!currentRide ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-900 uppercase ml-1 mb-1 block tracking-widest">Origin Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" />
                      <Input 
                        placeholder="Pickup Point" 
                        value={pickup} 
                        onChange={e => setPickup(e.target.value)} 
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-900 font-bold h-11 text-sm focus:ring-orange/50" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-900 uppercase ml-1 mb-1 block tracking-widest">Target Destination</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" />
                      <Input 
                        placeholder="Dropoff Target" 
                        value={dropoff} 
                        onChange={e => setDropoff(e.target.value)} 
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-900 font-bold h-11 text-sm focus:ring-orange/50" 
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {hasLocations && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2">
                        {SERVICES.find(s => s.id === activeService)?.vehicles.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all",
                              selectedVehicle === v.id ? "bg-orange/5 border-orange text-orange shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            <v.icon className="w-5 h-5 mb-0.5" />
                            <span className="text-[8px] font-black uppercase">{v.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="bg-slate-900 p-4 rounded-2xl flex justify-between items-center mt-2 shadow-2xl">
                        <div>
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-0.5">Est. Credits</p>
                          <p className="text-xl font-black text-white">₹{currentFare}</p>
                        </div>
                        <Button 
                          onClick={handleBookRide} 
                          className="bg-orange hover:bg-orange/90 font-black uppercase text-xs h-11 px-6 shadow-lg text-white border-none"
                        >
                          Deploy Unit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : currentRide.status === "Completed" || currentRide.status === "Paid" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-2">
                {currentRide.status === "Completed" && (
                  <div className="p-6 bg-slate-900 rounded-2xl text-center shadow-inner relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Final Settlement Required</p>
                    <p className="text-3xl font-black text-white">₹{currentRide.fare}</p>
                  </div>
                )}

                {currentRide.status === "Paid" && !reviewSubmitted && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-active/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-10 h-10 text-active" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Settlement Confirmed</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">Rate your Operator</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-90">
                          <Star className={cn("w-8 h-8", rating >= s ? "text-orange fill-orange" : "text-slate-200")} />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <Button onClick={() => handleSubmitReview(currentRide.id)} className="w-full bg-slate-900 text-white font-black uppercase text-xs h-12 shadow-lg border-none">
                        Submit Tactical Review
                      </Button>
                    )}
                  </div>
                )}

                {reviewSubmitted && (
                  <div className="text-center py-10 space-y-4">
                    <Zap className="w-12 h-12 text-orange mx-auto animate-pulse" />
                    <p className="text-sm font-black uppercase tracking-widest">Mission Archived</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Returning to Standby Protocol...</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="text-[10px] font-black uppercase border-slate-200">New Mission</Button>
                  </div>
                )}

                {currentRide.status === "Completed" && (
                  payingOnline ? (
                    <div className="text-center space-y-4">
                       <div className="w-36 h-36 bg-white mx-auto rounded-2xl flex items-center justify-center p-3 shadow-xl border-4 border-slate-900">
                          <QrCode className="w-full h-full text-slate-900" />
                       </div>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scan & Pay Operator</p>
                       <Button onClick={() => setPayingOnline(false)} variant="ghost" className="text-[10px] font-black uppercase text-slate-400">Switch to Cash</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button onClick={() => setPayingOnline(true)} className="w-full bg-orange hover:bg-orange/90 h-12 font-black uppercase flex items-center justify-center gap-3 text-white shadow-lg border-none">
                        <QrCode className="w-6 h-6" /> Pay Online / UPI
                      </Button>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                        <Banknote className="w-6 h-6 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-900">Paying with Cash?</p>
                          <p className="text-[9px] font-bold text-slate-400">Hand ₹{currentRide.fare} to operator</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4">
                <div className="text-center p-6 bg-white rounded-2xl border-2 border-slate-100 relative overflow-hidden shadow-sm">
                   <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                     <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1/3 h-full bg-orange" />
                   </div>
                   <p className="text-[12px] font-black text-orange uppercase tracking-[0.2em] mb-4">{currentRide.status}</p>
                   {driverProfile ? (
                     <div className="space-y-3">
                       <div className="w-16 h-16 rounded-full bg-white mx-auto ring-4 ring-slate-100 flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={`https://picsum.photos/seed/${driverProfile.id}/200/200`} alt="Driver" className="w-full h-full object-cover" />
                       </div>
                       <div>
                         <p className="text-base font-black uppercase text-slate-900">{driverProfile.name}</p>
                         <div className="flex items-center justify-center gap-1 mt-0.5">
                           <Star className="w-3 h-3 text-orange fill-orange" />
                           <span className="text-[10px] text-slate-500 uppercase font-black">
                             {driverProfile.rating > 0 ? driverProfile.rating.toFixed(1) : 'NEW'} Rating
                           </span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="py-6 space-y-4">
                        <div className="w-10 h-10 border-4 border-orange/10 border-t-orange rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {scanTimer !== null ? `Scanning Sector... ${scanTimer}s Remaining` : "Scanning Sector for Units..."}
                        </p>
                     </div>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-black h-11 shadow-md border-none">
                    <Phone className="w-4 h-4 mr-2 text-orange" /> Comms Link
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase font-black h-11 shadow-md border-none">
                    <ShieldAlert className="w-4 h-4 mr-2" /> SOS Signal
                  </Button>
                </div>
                {(currentRide.status === "Requested" || currentRide.status === "Accepted") && (
                  <Button onClick={() => handleCancelRide(currentRide.id)} variant="ghost" className="w-full text-[10px] font-black uppercase h-9 text-slate-400 hover:text-red-600 transition-all">Abort Mission</Button>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3 text-center border-none shadow-xl bg-white border-slate-100">
            <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Operator Rep</p>
            <p className="text-xl font-black text-slate-900">{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</p>
          </Card>
          <Card className="p-3 text-center border-none shadow-xl bg-white border-slate-100">
            <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Nexus Credits</p>
            <p className="text-xl font-black text-orange">₹{profile?.walletBalance || 0}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
