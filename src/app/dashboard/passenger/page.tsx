"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MapPin, Navigation, Car, Bike, Zap, Package, Truck, ShieldAlert, Star, Phone
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
    toast({ title: `${activeService} Broadcasted`, description: "Scanning sector for units." })
  }

  const handleCancelRide = (rideId: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "rides", rideId), { status: "Cancelled", cancelledAt: serverTimestamp() })
    toast({ variant: "destructive", title: "Mission Aborted", description: "Request purged." })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
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
                <TabsList className="grid grid-cols-3 bg-slate-900 p-1.5 h-20 rounded-xl shadow-inner">
                  {SERVICES.map(s => (
                    <TabsTrigger 
                      key={s.id} 
                      value={s.id} 
                      className="data-[state=active]:bg-orange data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(255,128,0,0.4)] transition-all flex flex-col items-center justify-center gap-1 py-2 h-full text-slate-400"
                    >
                      <s.icon className="w-6 h-6" /> 
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {s.name}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <CardTitle className="text-xl font-black uppercase tracking-tighter mt-6 text-slate-900 text-center border-b border-slate-100 pb-4">
              {currentRide ? `${currentRide.serviceType} Terminal` : "Initialize Mission"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!currentRide ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-900 uppercase ml-1 mb-1 block tracking-widest">Origin Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" />
                      <Input 
                        placeholder="Pickup Point" 
                        value={pickup} 
                        onChange={e => setPickup(e.target.value)} 
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-900 font-bold h-12 text-sm focus:ring-orange/50" 
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
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-900 font-bold h-12 text-sm focus:ring-orange/50" 
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {hasLocations && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-2">
                        {SERVICES.find(s => s.id === activeService)?.vehicles.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                              selectedVehicle === v.id ? "bg-orange/5 border-orange text-orange shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            <v.icon className="w-5 h-5 mb-1" />
                            <span className="text-[8px] font-black uppercase">{v.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl flex justify-between items-center mt-2 shadow-2xl">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Credits</p>
                          <p className="text-2xl font-black text-white">₹{currentFare}</p>
                        </div>
                        <Button 
                          onClick={handleBookRide} 
                          className="bg-orange hover:bg-orange/90 font-black uppercase text-xs h-12 px-6 shadow-lg"
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
                <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-slate-200 relative overflow-hidden shadow-sm">
                   <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
                     <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1/3 h-full bg-orange" />
                   </div>
                   <p className="text-[10px] font-black text-orange uppercase tracking-[0.2em] mb-4">{currentRide.status}</p>
                   {driverProfile ? (
                     <div className="space-y-4">
                       <div className="w-20 h-20 rounded-full bg-white mx-auto ring-4 ring-slate-100 flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={`https://picsum.photos/seed/${driverProfile.id}/200/200`} alt="Driver" className="w-full h-full object-cover" />
                       </div>
                       <div>
                         <p className="text-lg font-black uppercase text-slate-900">{driverProfile.name}</p>
                         <div className="flex items-center justify-center gap-1 mt-1">
                           <Star className="w-3 h-3 text-orange fill-orange" />
                           <span className="text-[10px] text-slate-500 uppercase font-black">{driverProfile.rating || '5.0'} Rating</span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="py-8 space-y-4">
                        <div className="w-12 h-12 border-4 border-orange/10 border-t-orange rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching Sector...</p>
                     </div>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-slate-300 text-[10px] uppercase font-black h-12 text-slate-900 hover:bg-slate-100 shadow-sm"><Phone className="w-4 h-4 mr-2" /> Comms</Button>
                  <Button variant="outline" className="border-slate-300 text-[10px] uppercase font-black h-12 text-slate-900 hover:bg-slate-100 shadow-sm"><ShieldAlert className="w-4 h-4 mr-2 text-red-600" /> SOS</Button>
                </div>
                {(currentRide.status === "Requested" || currentRide.status === "Accepted") && (
                  <Button onClick={() => handleCancelRide(currentRide.id)} variant="ghost" className="w-full text-[10px] font-black uppercase h-10 text-slate-400 hover:text-red-600 transition-all">Abort Mission</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center border-none shadow-xl bg-white">
            <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Operator Rep</p>
            <p className="text-2xl font-black text-slate-900">{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</p>
          </Card>
          <Card className="p-4 text-center border-none shadow-xl bg-white">
            <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Nexus Credits</p>
            <p className="text-2xl font-black text-orange">₹{profile?.walletBalance || 0}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}