"use client"

import React, { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import { 
  MapPin, Navigation, CreditCard, Star, Search, Car, Phone, 
  MessageSquare, CheckCircle2, XCircle, Bike, Zap, 
  ArrowUpCircle, Timer, LocateFixed, Package, Truck, ShieldAlert 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, doc, limit } from "firebase/firestore"
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
  
  const hasLocations = pickup.trim().length > 2 && dropoff.trim().length > 2
  const mockDistance = useMemo(() => hasLocations ? Math.floor(Math.random() * 8) + 2 : 0, [hasLocations, pickup, dropoff])

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)

  // Explicitly filtered query to match security rules
  const activeRidesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "rides"), 
      where("passengerId", "==", user.uid), 
      where("status", "in", ["Requested", "Accepted", "Arrived", "InProgress"]),
      limit(1)
    )
  }, [user, db])

  const { data: activeRides } = useCollection(activeRidesQuery)
  const currentRide = activeRides?.[0]

  const driverProfileRef = useMemoFirebase(() => currentRide?.driverId && db ? doc(db, "userProfiles", currentRide.driverId) : null, [currentRide?.driverId, db])
  const { data: driverProfile } = useDoc(driverProfileRef)

  const currentFare = useMemo(() => {
    const service = SERVICES.find(s => s.id === activeService)
    const vehicle = service?.vehicles.find(v => v.id === selectedVehicle)
    if (!vehicle || !hasLocations) return 0
    return Math.max(vehicle.min, mockDistance * vehicle.rate)
  }, [activeService, selectedVehicle, mockDistance, hasLocations])

  useEffect(() => {
    gsap.from(".passenger-card", { y: 20, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power3.out" })
  }, [])

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
    toast({ title: `${activeService} Broadcasted`, description: "Scanning sector for nearest available units." })
  }

  const handleCancelRide = (rideId: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { status: "Cancelled", cancelledAt: serverTimestamp() })
    toast({ variant: "destructive", title: "Operation Terminated", description: "Request purged from dispatch queue." })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-2">
      <div className="lg:col-span-2 relative h-[500px] lg:h-full rounded-2xl overflow-hidden border border-navy shadow-2xl">
        <TacticalMap 
          markers={currentRide || hasLocations ? [
            { id: 'p', lat: 12.9716, lng: 77.5946, label: 'Origin', type: 'pickup' },
            { id: 'd', lat: 12.8452, lng: 77.6632, label: 'Target', type: 'dropoff' }
          ] : []}
        />
      </div>

      <div className="space-y-6">
        <Card className="glass-panel passenger-card border-t-4 border-orange bg-card/95">
          <CardHeader className="pb-2">
            {!currentRide && (
              <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
                <TabsList className="grid grid-cols-3 bg-navy border-2 border-white/20 p-1 h-24">
                  {SERVICES.map(s => (
                    <TabsTrigger 
                      key={s.id} 
                      value={s.id} 
                      className="text-slate-400 font-black uppercase text-sm data-[state=active]:text-white data-[state=active]:bg-orange data-[state=active]:shadow-[0_0_25px_rgba(255,128,0,0.6)] transition-all flex flex-col items-center justify-center gap-2 py-4 h-full hover:text-white"
                    >
                      <s.icon className="w-8 h-8" /> 
                      <span className="truncate font-black">{s.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <CardTitle className="text-2xl font-black uppercase tracking-tighter mt-6 text-white text-center">
              {currentRide ? `${currentRide.serviceType} Protocol` : "Initialize Mission"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!currentRide ? (
              <>
                <div className="space-y-4 relative">
                  <div>
                    <label className="text-sm font-black text-white uppercase ml-1 mb-2 block tracking-widest">Origin Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-active" />
                      <Input 
                        placeholder="Pickup Location" 
                        value={pickup} 
                        onChange={e => setPickup(e.target.value)} 
                        className="pl-10 bg-navy/50 border-2 border-white/30 text-white placeholder:text-white/40 font-bold h-12 text-sm focus:border-orange/50" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-black text-white uppercase ml-1 mb-2 block tracking-widest">Target Destination</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emergency" />
                      <Input 
                        placeholder="Dropoff Destination" 
                        value={dropoff} 
                        onChange={e => setDropoff(e.target.value)} 
                        className="pl-10 bg-navy/50 border-2 border-white/30 text-white placeholder:text-white/40 font-bold h-12 text-sm focus:border-orange/50" 
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {hasLocations && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-2">
                        {SERVICES.find(s => s.id === activeService)?.vehicles.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                              selectedVehicle === v.id ? "bg-orange/20 border-orange text-orange shadow-[0_0_10px_rgba(255,128,0,0.4)]" : "bg-navy/60 border-white/10 text-slate-300 hover:text-white hover:bg-navy/80"
                            )}
                          >
                            <v.icon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-black uppercase">{v.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="bg-navy p-5 rounded-xl border-2 border-white/20 flex justify-between items-center mt-2 shadow-inner">
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Estimated credits</p>
                          <p className="text-3xl font-black text-orange">₹{currentFare}</p>
                        </div>
                        <Button 
                          onClick={handleBookRide} 
                          className="bg-orange hover:bg-orange/90 font-black uppercase text-xs h-14 px-8 text-white shadow-[0_0_20px_rgba(255,128,0,0.5)] border-2 border-white/10"
                        >
                          Deploy Unit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="space-y-6 pt-4">
                <div className="text-center p-8 bg-orange/10 rounded-2xl border-2 border-orange/40 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-orange/20">
                     <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1/3 h-full bg-orange shadow-[0_0_10px_#FF8000]" />
                   </div>
                   <p className="text-sm font-black text-orange uppercase tracking-[0.3em] mb-4 drop-shadow-[0_0_5px_rgba(255,128,0,0.5)]">{currentRide.status}</p>
                   {driverProfile ? (
                     <div className="space-y-4">
                       <div className="w-24 h-24 rounded-full bg-navy/80 mx-auto ring-4 ring-orange/40 flex items-center justify-center overflow-hidden shadow-2xl">
                          <img src={`https://picsum.photos/seed/${driverProfile.id}/200/200`} alt="Driver" className="w-full h-full object-cover" />
                       </div>
                       <div>
                         <p className="text-xl font-black uppercase text-white tracking-tight">{driverProfile.name}</p>
                         <div className="flex items-center justify-center gap-1 mt-1">
                           <Star className="w-4 h-4 text-orange fill-orange" />
                           <span className="text-xs text-white uppercase font-black">{driverProfile.rating || '5.0'} • Sector 4 Dispatch</span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="py-8 space-y-4">
                        <div className="w-16 h-16 border-4 border-orange/20 border-t-orange rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(255,128,0,0.2)]" />
                        <p className="text-xs font-black uppercase tracking-widest text-white animate-pulse">Scanning for nearest unit...</p>
                     </div>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-navy text-[10px] uppercase font-black h-14 text-white hover:bg-navy/60 bg-navy/40"><Phone className="w-4 h-4 mr-2" /> Voice Comms</Button>
                  <Button variant="outline" className="border-navy text-[10px] uppercase font-black h-14 text-white hover:bg-navy/60 bg-navy/40"><ShieldAlert className="w-4 h-4 mr-2 text-emergency" /> SOS Signal</Button>
                </div>
                {(currentRide.status === "Requested" || currentRide.status === "Accepted") && (
                  <Button onClick={() => handleCancelRide(currentRide.id)} variant="ghost" className="w-full text-[10px] font-black uppercase h-12 text-white/70 hover:text-emergency transition-all">Abort Mission</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-panel p-5 text-center border-2 border-white/20 bg-navy/60">
            <p className="text-xs uppercase font-black text-white mb-1 tracking-widest">Operator Rep</p>
            <p className="text-3xl font-black text-white">{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</p>
          </Card>
          <Card className="glass-panel p-5 text-center border-2 border-white/20 bg-navy/60">
            <p className="text-xs uppercase font-black text-white mb-1 tracking-widest">Nexus Credits</p>
            <p className="text-3xl font-black text-active">₹{profile?.walletBalance || 0}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}