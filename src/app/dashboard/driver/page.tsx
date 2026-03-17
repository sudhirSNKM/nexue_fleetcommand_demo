
"use client"

import React, { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation, Power, AlertCircle, Phone, MessageSquare, CreditCard, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TacticalMap from "@/components/dashboard/TacticalMap"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, serverTimestamp, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function DriverApp() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const todayDate = new Date().toISOString().split('T')[0]
  const statsId = `${user?.uid}_${todayDate}`

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile } = useDoc(userProfileRef)
  const isOnline = profile?.status === "Online"

  const statsRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "driverStats", statsId)
  }, [user, db, statsId])

  const { data: dailyStats } = useDoc(statsRef)

  const activeRidesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "rides"), where("status", "==", "Requested"))
  }, [user, db])

  const { data: pendingRides } = useCollection(activeRidesQuery)

  const assignedRidesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "rides"), where("driverId", "==", user.uid), where("status", "in", ["Accepted", "Arrived", "InProgress"]))
  }, [user, db])

  const { data: assignedRides } = useCollection(assignedRidesQuery)

  const handleToggleOnline = () => {
    if (!user || !userProfileRef) return
    updateDocumentNonBlocking(userProfileRef, {
      status: isOnline ? "Offline" : "Online"
    })
  }

  const handleAcceptRide = (rideId: string) => {
    if (!user || !db) return
    const rideRef = doc(db, "rides", rideId)
    updateDocumentNonBlocking(rideRef, {
      driverId: user.uid,
      status: "Accepted",
      acceptedAt: serverTimestamp()
    })
    toast({ title: "Ride Accepted", description: "Navigating to passenger pickup point." })
  }

  const handleUpdateStatus = (rideId: string, nextStatus: string, fare?: number) => {
    if (!db || !user) return
    const rideRef = doc(db, "rides", rideId)
    
    if (nextStatus === "Completed") {
      updateDocumentNonBlocking(rideRef, { 
        status: "Completed",
        endTime: serverTimestamp()
      })

      // Update Daily Stats
      if (statsRef) {
        setDocumentNonBlocking(statsRef, {
          driverId: user.uid,
          date: todayDate,
          earnings: increment(fare || 0),
          rideCount: increment(1)
        }, { merge: true })
      }
      toast({ title: "Ride Completed", description: `Earnings added: ₹${fare}` })
    } else {
      updateDocumentNonBlocking(rideRef, { status: nextStatus })
    }
  }

  const activeRide = assignedRides?.[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 relative h-[500px] lg:h-full">
        <TacticalMap markers={activeRide ? [
          { id: 'p', lat: activeRide.pickup.lat, lng: activeRide.pickup.lng, label: 'Pickup', type: 'pickup' },
          { id: 'd', lat: activeRide.dropoff.lat, lng: activeRide.dropoff.lng, label: 'Dropoff', type: 'dropoff' }
        ] : []} />
      </div>

      <div className="space-y-6">
        <Card className="glass-panel border-b-4 border-orange overflow-hidden">
          <CardHeader className="p-4 bg-navy/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Captain Terminal</CardTitle>
            <Button 
              onClick={handleToggleOnline}
              size="sm" 
              className={isOnline ? "bg-active hover:bg-active/90" : "bg-muted hover:bg-muted/90"}
            >
              <Power className="w-4 h-4 mr-2" /> {isOnline ? "ONLINE" : "OFFLINE"}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {activeRide ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-orange/20 text-orange mb-2">RIDE IN PROGRESS</Badge>
                      <h3 className="text-lg font-black uppercase">{activeRide.pickup.address}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-active">₹{activeRide.fare}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Expected Pay</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 border-navy h-12" onClick={() => toast({ title: "Call Protocol", description: "Dialing passenger secure line..." })}><Phone className="w-4 h-4 mr-2" /> Call</Button>
                    <Button variant="outline" className="flex-1 border-navy h-12" onClick={() => toast({ title: "Chat Protocol", description: "Opening secure messaging node..." })}><MessageSquare className="w-4 h-4 mr-2" /> Chat</Button>
                  </div>

                  {activeRide.status === "Accepted" && (
                    <Button 
                      onClick={() => handleUpdateStatus(activeRide.id, "Arrived")}
                      className="w-full bg-orange h-14 font-black uppercase tracking-widest"
                    >
                      I Have Arrived
                    </Button>
                  )}

                  {activeRide.status === "Arrived" && (
                    <Button 
                      onClick={() => handleUpdateStatus(activeRide.id, "InProgress")}
                      className="w-full bg-active h-14 font-black uppercase tracking-widest"
                    >
                      Start Ride (Punch In)
                    </Button>
                  )}

                  {activeRide.status === "InProgress" && (
                    <Button 
                      onClick={() => handleUpdateStatus(activeRide.id, "Completed", activeRide.fare)}
                      className="w-full bg-emergency h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                    >
                      Complete Ride (Punch Out)
                    </Button>
                  )}
                </motion.div>
              ) : isOnline ? (
                <motion.div key="online" className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-full border-4 border-active/30 border-t-active animate-spin mx-auto" />
                  <p className="text-xs font-black uppercase tracking-widest text-active">Waiting for requests...</p>
                  
                  {pendingRides && pendingRides.length > 0 && (
                    <div className="pt-8 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">New Request Nearby</h4>
                      <Card className="bg-navy/20 border-orange/30 p-4 text-left">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-sm font-bold">{pendingRides[0].pickup.address}</p>
                          <span className="text-orange font-black">₹{pendingRides[0].fare}</span>
                        </div>
                        <Button 
                          onClick={() => handleAcceptRide(pendingRides[0].id)}
                          className="w-full bg-orange font-black uppercase text-xs"
                        >
                          Accept Ride
                        </Button>
                      </Card>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-12 opacity-50">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xs font-black uppercase tracking-widest">Go online to receive jobs</p>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
           <Card className="glass-panel p-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Today's Earnings</p>
              <h4 className="text-2xl font-black">₹{dailyStats?.earnings || 0}</h4>
           </Card>
           <Card className="glass-panel p-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Rides Today</p>
              <h4 className="text-2xl font-black">{dailyStats?.rideCount || 0}</h4>
           </Card>
        </div>
      </div>
    </div>
  )
}
