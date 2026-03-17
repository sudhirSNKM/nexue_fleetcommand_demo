
"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Navigation, Clock, CreditCard, Star, Search, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function PassengerApp() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [step, setStep] = useState<'idle' | 'searching' | 'matched'>('idle')
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")

  const activeRidesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "rides"), where("passengerId", "==", user.uid), where("status", "in", ["Requested", "Accepted", "Arrived", "InProgress"]))
  }, [user, db])

  const { data: activeRides } = useCollection(activeRidesQuery)

  const handleBookRide = async () => {
    if (!user) return
    setStep('searching')
    try {
      await addDoc(collection(db, "rides"), {
        passengerId: user.uid,
        pickup: { address: pickup || "Current Location", lat: 12.9716, lng: 77.5946 },
        dropoff: { address: dropoff || "Electronic City", lat: 12.8452, lng: 77.6632 },
        status: "Requested",
        fare: 154,
        createdAt: serverTimestamp()
      })
      toast({ title: "Ride Requested", description: "Locating the nearest captain..." })
    } catch (e) {
      setStep('idle')
    }
  }

  const currentRide = activeRides?.[0]

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
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Where to?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <AnimatePresence mode="wait">
              {!currentRide ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-navy/10 p-4 rounded-lg border border-white/5 mb-4">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Estimated Fare</span>
                        <span className="text-lg font-black text-orange">₹154.00</span>
                     </div>
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">Standard Bike • 12 mins est.</p>
                  </div>
                  <Button 
                    onClick={handleBookRide}
                    className="w-full bg-orange hover:bg-orange/90 h-14 font-black uppercase tracking-widest text-lg"
                  >
                    Request Ride
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-orange/10 rounded-xl border border-orange/20 text-center"
                >
                  <div className="w-16 h-16 bg-orange rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-1">Ride {currentRide.status}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-4">Captain arriving in 4 mins</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-navy font-bold uppercase text-xs">Chat</Button>
                    <Button variant="destructive" className="flex-1 font-bold uppercase text-xs">Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
           <Card className="glass-panel p-4 text-center">
              <Star className="w-5 h-5 mx-auto mb-2 text-orange" />
              <p className="text-[10px] uppercase font-black text-muted-foreground">Rating</p>
              <p className="text-xl font-black">4.8</p>
           </Card>
           <Card className="glass-panel p-4 text-center">
              <CreditCard className="w-5 h-5 mx-auto mb-2 text-active" />
              <p className="text-[10px] uppercase font-black text-muted-foreground">Wallet</p>
              <p className="text-xl font-black">₹420</p>
           </Card>
        </div>
      </div>
    </div>
  )
}
