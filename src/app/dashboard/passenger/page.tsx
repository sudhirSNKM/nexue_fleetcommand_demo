
"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Navigation, CreditCard, Star, Search, Car, Phone, MessageSquare, CheckCircle2, XCircle, Bike, Zap, ArrowUpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, doc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const VEHICLE_TYPES = [
  { id: 'Bike', name: 'Bike', icon: Bike, baseRate: 10, minFare: 30 },
  { id: 'Auto', name: 'Auto', icon: Zap, baseRate: 15, minFare: 50 },
  { id: 'Cab', name: 'Cab', icon: Car, baseRate: 25, minFare: 80 }
]

export default function PassengerApp() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState('Bike')
  
  // Simulated distance between 3 and 10 km
  const mockDistance = useMemo(() => Math.floor(Math.random() * 7) + 3, [pickup, dropoff])

  // Fetch Passenger Profile
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile } = useDoc(userProfileRef)

  // Fetch Active Rides
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

  // Fetch Driver Profile if assigned
  const driverProfileRef = useMemoFirebase(() => {
    if (!currentRide?.driverId || !db) return null
    return doc(db, "userProfiles", currentRide.driverId)
  }, [currentRide?.driverId, db])

  const { data: driverProfile } = useDoc(driverProfileRef)

  const currentFare = useMemo(() => {
    const vehicle = VEHICLE_TYPES.find(v => v.id === selectedVehicle)
    if (!vehicle) return 0
    return Math.max(vehicle.minFare, mockDistance * vehicle.baseRate)
  }, [selectedVehicle, mockDistance])

  const handleBookRide = async () => {
    if (!user || !db) return
    
    addDoc(collection(db, "rides"), {
      passengerId: user.uid,
      pickup: { address: pickup || "Current Location", lat: 12.9716, lng: 77.5946 },
      dropoff: { address: dropoff || "Electronic City", lat: 12.8452, lng: 77.6632 },
      status: "Requested",
      vehicleType: selectedVehicle,
      distance: mockDistance,
      fare: currentFare,
      createdAt: serverTimestamp()
    })
    toast({ title: "Ride Requested", description: `Locating the nearest ${selectedVehicle} captain...` })
  }

  const handleBoostFare = () => {
    if (!currentRide || !db) return
    const rideRef = doc(db, "rides", currentRide.id)
    updateDocumentNonBlocking(rideRef, {
      fare: increment(20)
    })
    toast({ title: "Offer Boosted", description: "Incentive increased by ₹20 to attract captains faster." })
  }

  const handleCancelRide = (rideId: string) => {
    if (!db) return
    const rideRef = doc(db, "rides", rideId)
    updateDocumentNonBlocking(rideRef, { 
      status: "Cancelled",
      cancelledAt: serverTimestamp()
    })
    toast({ 
      variant: "destructive",
      title: "Mission Aborted", 
      description: "Your ride request has been terminated." 
    })
  }

  const handleProcessPayment = (rideId: string, method: string, amount: number) => {
    if (!db || !user) return
    const rideRef = doc(db, "rides", rideId)
    const userRef = doc(db, "userProfiles", user.uid)

    updateDocumentNonBlocking(rideRef, { 
      status: "Paid", 
      paymentMethod: method 
    })

    if (method === 'Wallet') {
      updateDocumentNonBlocking(userRef, {
        walletBalance: increment(-amount)
      })
    }

    toast({ title: "Payment Successful", description: `Processed via ${method}. Protocol complete.` })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 relative h-[600px] lg:h-full">
        <TacticalMap 
          markers={currentRide ? [
            { id: 'p', lat: 12.9716, lng: 77.5946, label: 'Pickup', type: 'pickup' },
            { id: 'd', lat: 12.8452, lng: 77.6632, label: 'Dropoff', type: 'dropoff' }
          ] : []}
        />
      </div>

      <div className="space-y-6">
        <Card className="glass-panel border-t-4 border-orange">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tighter">
              {currentRide?.status === "Completed" ? "Mission Complete" : 
               currentRide?.status === "Requested" ? "Seeking Captain" : "Where to?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentRide ? (
              <>
                <div className="space-y-3 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-orange/20" />
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-active" />
                    <Input 
                      placeholder="Pickup Location" 
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="pl-10 bg-navy/20 border-navy" 
                    />
                  </div>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emergency" />
                    <Input 
                      placeholder="Dropoff Location" 
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="pl-10 bg-navy/20 border-navy" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2">
                  {VEHICLE_TYPES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                        selectedVehicle === v.id 
                          ? "bg-orange/20 border-orange text-orange shadow-[0_0_15px_rgba(255,128,0,0.2)]" 
                          : "bg-navy/20 border-navy text-muted-foreground hover:border-orange/50"
                      )}
                    >
                      <v.icon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-black uppercase">{v.name}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-navy/10 p-4 rounded-lg border border-white/5 mb-4">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Est. Fare ({mockDistance}km)</span>
                      <span className="text-lg font-black text-orange">₹{currentFare}</span>
                   </div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">{selectedVehicle} Protocol • Fast Dispatch</p>
                </div>
                <Button 
                  onClick={handleBookRide}
                  className="w-full bg-orange hover:bg-orange/90 h-14 font-black uppercase tracking-widest text-lg"
                >
                  Request {selectedVehicle}
                </Button>
              </>
            ) : currentRide.status === "Completed" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="text-center p-4 bg-active/10 rounded-xl border border-active/20">
                  <CheckCircle2 className="w-12 h-12 text-active mx-auto mb-2" />
                  <h3 className="font-black uppercase">Final Fare: ₹{currentRide.fare}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Select Payment Protocol</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={() => handleProcessPayment(currentRide.id, 'Wallet', currentRide.fare)} 
                    variant="outline" 
                    className="h-14 border-navy justify-start px-6"
                    disabled={(profile?.walletBalance || 0) < currentRide.fare}
                  >
                    <CreditCard className="w-5 h-5 mr-3 text-orange" /> 
                    Pay with Nexus Wallet (₹{profile?.walletBalance || 0})
                  </Button>
                  <Button onClick={() => handleProcessPayment(currentRide.id, 'UPI', currentRide.fare)} variant="outline" className="h-14 border-navy justify-start px-6"><Navigation className="w-5 h-5 mr-3 text-active" /> UPI Terminal</Button>
                  <Button onClick={() => handleProcessPayment(currentRide.id, 'Cash', currentRide.fare)} variant="outline" className="h-14 border-navy justify-start px-6"><Car className="w-5 h-5 mr-3 text-muted-foreground" /> Cash Transaction</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-orange/10 rounded-xl border border-orange/20"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-[0_0_20px_rgba(255,128,0,0.4)]">
                    {currentRide.vehicleType === 'Bike' ? <Bike className="w-8 h-8 text-white" /> : <Car className="w-8 h-8 text-white" />}
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-1">Ride {currentRide.status}</h3>
                  <p className="text-xl font-black text-orange mb-2">₹{currentRide.fare}</p>
                  
                  {driverProfile ? (
                    <p className="text-xs text-orange font-black uppercase tracking-[0.2em] mb-4">
                      Captain: {driverProfile.name} • ID: {driverProfile.id.substring(0, 6)}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold animate-pulse">Scanning for nearby {currentRide.vehicleType} operators...</p>
                      <Button 
                        onClick={handleBoostFare}
                        variant="outline"
                        className="w-full border-orange text-orange hover:bg-orange/10 font-black uppercase text-xs"
                      >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Boost Offer (+₹20)
                      </Button>
                    </div>
                  )}
                </div>
                
                {driverProfile && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-navy font-bold uppercase text-xs" onClick={() => toast({ title: "Secure Line", description: `Calling Captain ${driverProfile?.name || '...'}` })}><Phone className="w-4 h-4 mr-2" /> Call</Button>
                    <Button variant="outline" className="flex-1 border-navy font-bold uppercase text-xs" onClick={() => toast({ title: "Messaging Subsystem", description: "Opening encrypted chat..." })}><MessageSquare className="w-4 h-4 mr-2" /> Chat</Button>
                  </div>
                )}

                {(currentRide.status === "Requested" || currentRide.status === "Accepted") && (
                  <Button 
                    variant="destructive" 
                    className="w-full mt-4 font-bold uppercase text-xs"
                    onClick={() => handleCancelRide(currentRide.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Mission
                  </Button>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
           <Card className="glass-panel p-4 text-center">
              <Star className="w-5 h-5 mx-auto mb-2 text-orange" />
              <p className="text-[10px] uppercase font-black text-muted-foreground">Rating</p>
              <p className="text-xl font-black">{profile?.rating || '0.0'}</p>
           </Card>
           <Card className="glass-panel p-4 text-center">
              <CreditCard className="w-5 h-5 mx-auto mb-2 text-active" />
              <p className="text-[10px] uppercase font-black text-muted-foreground">Wallet</p>
              <p className="text-xl font-black">₹{profile?.walletBalance || 0}</p>
           </Card>
        </div>
      </div>
    </div>
  )
}
