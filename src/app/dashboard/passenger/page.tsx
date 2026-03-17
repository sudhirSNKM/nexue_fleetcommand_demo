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
import { collection, query, where, addDoc, serverTimestamp, doc, increment } from "firebase/firestore"
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

  const activeRidesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "rides"), 
      where("passengerId", "==", user.uid), 
      where("status", "in", ["Requested", "Accepted", "Arrived", "InProgress", "Completed"])
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

  const handleProcessPayment = (rideId: string, method: string, amount: number) => {
    if (!db || !user) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { status: "Paid", paymentMethod: method })
    if (method === 'Wallet') updateDocumentNonBlocking(doc(db, "userProfiles", user.uid), { walletBalance: increment(-amount) })
    toast({ title: "Settlement Confirmed", description: `Mission finalized via ${method} protocol.` })
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
        <Card className="glass-panel passenger-card border-t-4 border-orange">
          <CardHeader className="pb-2">
            {!currentRide && (
              <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
                <TabsList className="grid grid-cols-3 bg-navy border border-white/20 p-1 h-16">
                  {SERVICES.map(s => (
                    <TabsTrigger 
                      key={s.id} 
                      value={s.id} 
                      className="text-sm font-black uppercase text-white data-[state=active]:text-white data-[state=active]:bg-orange transition-all flex items-center justify-center gap-2"
                    >
                      <s.icon className="w-5 h-5" /> 
                      <span className="hidden sm:inline">{s.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <CardTitle className="text-xl font-black uppercase tracking-tighter mt-6 text-white text-center">
              {currentRide ? `${currentRide.serviceType} Protocol` : "Initialize Mission"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!currentRide ? (
              <>
                <div className="space-y-3 relative">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-active" />
                    <Input 
                      placeholder="Pickup Origin" 
                      value={pickup} 
                      onChange={e => setPickup(e.target.value)} 
                      className="pl-10 bg-navy/60 border-navy text-sm text-white placeholder:text-white/80 font-bold h-12" 
                    />
                  </div>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emergency" />
                    <Input 
                      placeholder="Dropoff Destination" 
                      value={dropoff} 
                      onChange={e => setDropoff(e.target.value)} 
                      className="pl-10 bg-navy/60 border-navy text-sm text-white placeholder:text-white/80 font-bold h-12" 
                    />
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
                              "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                              selectedVehicle === v.id ? "bg-orange/20 border-orange text-orange shadow-[0_0_10px_rgba(255,128,0,0.2)]" : "bg-navy/40 border-navy text-white hover:text-white hover:bg-navy/60"
                            )}
                          >
                            <v.icon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-black uppercase">{v.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="bg-navy/50 p-5 rounded-xl border border-white/10 flex justify-between items-center mt-2">
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Est. Credits</p>
                          <p className="text-3xl font-black text-orange">₹{currentFare}</p>
                        </div>
                        <Button 
                          onClick={handleBookRide} 
                          className="bg-orange hover:bg-orange/90 font-black uppercase text-xs h-12 px-8 text-white shadow-[0_0_20px_rgba(255,128,0,0.3)]"
                        >
                          Deploy
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : currentRide.status === "Completed" ? (
              <div className="space-y-4 text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-active mx-auto animate-bounce mb-2" />
                <h3 className="text-lg font-black uppercase text-white">Mission Finalized</h3>
                <p className="text-4xl font-black text-active">₹{currentRide.fare}</p>
                <div className="grid gap-3 pt-4">
                  <Button onClick={() => handleProcessPayment(currentRide.id, 'Wallet', currentRide.fare)} variant="outline" className="border-navy h-14 justify-between text-white hover:bg-navy/40 px-6">
                    <span className="font-bold uppercase text-xs">Nexus Wallet</span> 
                    <span className="text-active font-black">₹{profile?.walletBalance || 0}</span>
                  </Button>
                  <Button onClick={() => handleProcessPayment(currentRide.id, 'Cash', currentRide.fare)} variant="outline" className="border-navy h-14 text-white hover:bg-navy/40 font-bold uppercase text-xs">Settlement via Cash</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                <div className="text-center p-8 bg-orange/10 rounded-2xl border border-orange/20 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-orange/20">
                     <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity }} className="w-1/3 h-full bg-orange" />
                   </div>
                   <p className="text-xs font-black text-orange uppercase tracking-[0.3em] mb-4">{currentRide.status}</p>
                   {driverProfile ? (
                     <div className="space-y-3">
                       <div className="w-20 h-20 rounded-full bg-navy/60 mx-auto ring-4 ring-orange/20 flex items-center justify-center overflow-hidden">
                          <img src={`https://picsum.photos/seed/${driverProfile.id}/100/100`} alt="Driver" />
                       </div>
                       <div>
                         <p className="text-lg font-black uppercase text-white">{driverProfile.name}</p>
                         <div className="flex items-center justify-center gap-1 mt-1">
                           <Star className="w-4 h-4 text-orange fill-orange" />
                           <span className="text-xs text-white uppercase font-black">{driverProfile.rating || '5.0'} • Sector 4 Dispatch</span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="py-4 space-y-4">
                        <div className="w-12 h-12 border-4 border-orange/20 border-t-orange rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Scanning for nearest unit...</p>
                     </div>
                   )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-navy text-[10px] uppercase font-black h-14 text-white hover:bg-navy/40"><Phone className="w-4 h-4 mr-2" /> Voice Comms</Button>
                  <Button variant="outline" className="flex-1 border-navy text-[10px] uppercase font-black h-14 text-white hover:bg-navy/40"><ShieldAlert className="w-4 h-4 mr-2 text-emergency" /> SOS Signal</Button>
                </div>
                {(currentRide.status === "Requested" || currentRide.status === "Accepted") && (
                  <Button onClick={() => handleCancelRide(currentRide.id)} variant="ghost" className="w-full text-[10px] font-black uppercase h-10 text-white hover:text-emergency transition-colors">Abort Mission</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-panel passenger-card p-5 text-center border-white/10 bg-navy/30">
            <p className="text-[10px] uppercase font-black text-white mb-1 tracking-widest">Operator Rep</p>
            <p className="text-3xl font-black text-white">{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</p>
          </Card>
          <Card className="glass-panel passenger-card p-5 text-center border-white/10 bg-navy/30">
            <p className="text-[10px] uppercase font-black text-white mb-1 tracking-widest">Nexus Credits</p>
            <p className="text-3xl font-black text-active">₹{profile?.walletBalance || 0}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}