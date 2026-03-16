
"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Square, 
  MapPin, 
  Camera, 
  Star,
  Fuel,
  Navigation,
  CheckCircle2,
  Clock,
  Coffee
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, serverTimestamp } from "firebase/firestore"

export default function DriverDutyPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeShift, setActiveShift] = useState<any>(null)

  // Fetch active trips assigned to this driver
  const tripsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "trips"), where("driverId", "==", user.uid), where("status", "!=", "Completed"))
  }, [user, db])

  const { data: activeTrips, isLoading: tripsLoading } = useCollection(tripsQuery)

  // Fetch current active shift
  const shiftsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "driverShifts"), where("driverId", "==", user.uid), where("status", "==", "Active"))
  }, [user, db])

  const { data: shifts } = useCollection(shiftsQuery)

  useEffect(() => {
    if (shifts && shifts.length > 0) {
      setActiveShift(shifts[0])
    } else {
      setActiveShift(null)
    }
  }, [shifts])

  const handleStartShift = () => {
    if (!user) return
    const newShift = {
      driverId: user.uid,
      punchInTime: serverTimestamp(),
      status: "Active",
      shiftDate: new Date().toISOString().split('T')[0]
    }
    addDocumentNonBlocking(collection(db, "driverShifts"), newShift)
  }

  const handleEndShift = () => {
    if (!activeShift) return
    const shiftRef = doc(db, "driverShifts", activeShift.id)
    updateDocumentNonBlocking(shiftRef, {
      status: "Completed",
      punchOutTime: serverTimestamp()
    })
  }

  const handlePunchInLoad = (tripId: string) => {
    const tripRef = doc(db, "trips", tripId)
    updateDocumentNonBlocking(tripRef, {
      status: "EnRouteToDropoff",
      loadLoadedTimestamp: serverTimestamp()
    })
  }

  const handlePunchOutDelivery = (tripId: string) => {
    const tripRef = doc(db, "trips", tripId)
    updateDocumentNonBlocking(tripRef, {
      status: "Completed",
      loadDeliveredTimestamp: serverTimestamp(),
      tripEndTime: serverTimestamp()
    })
  }

  const activeTrip = activeTrips?.[0]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Duty Terminal</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Operator Protocol</p>
        </div>
        {activeShift && (
          <Badge className="bg-active/20 text-active border-active animate-pulse">ON-DUTY</Badge>
        )}
      </div>

      {!activeShift ? (
        <Card className="glass-panel border-dashed border-navy/50 p-12 text-center">
          <div className="w-20 h-20 bg-navy/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-orange" />
          </div>
          <h2 className="text-xl font-black uppercase mb-2">Initialize Shift</h2>
          <p className="text-sm text-muted-foreground mb-8">System standby. Ready to begin tactical operations.</p>
          <Button 
            onClick={handleStartShift}
            className="w-full bg-orange hover:bg-orange/90 h-14 font-black uppercase tracking-widest"
          >
            Punch In to Duty
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Trip Assignment */}
          <Card className="glass-panel border-l-4 border-orange">
            <CardHeader className="bg-navy/10 border-b border-navy/20">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                <Navigation className="w-4 h-4 text-orange" />
                Current Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {activeTrip ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</p>
                      <Badge variant="outline" className="text-orange border-orange/30 uppercase">{activeTrip.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Trip ID</p>
                      <span className="font-mono text-xs font-bold">{activeTrip.id.substring(0,8)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-orange" />
                        <div className="w-0.5 flex-1 bg-navy/30 my-1" />
                        <div className="w-3 h-3 rounded-full bg-active" />
                      </div>
                      <div className="space-y-6 flex-1">
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Pickup</p>
                          <p className="text-sm font-bold">{activeTrip.pickupAddress}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Dropoff</p>
                          <p className="text-sm font-bold">{activeTrip.dropoffAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-navy/20 flex flex-col gap-3">
                    {activeTrip.status === "Pending" && (
                       <Button className="w-full bg-navy/40 hover:bg-navy/60 border border-navy/50 font-black uppercase text-xs h-12">
                         Navigate to Pickup
                       </Button>
                    )}
                    
                    {activeTrip.status === "Pending" && (
                      <Button 
                        onClick={() => handlePunchInLoad(activeTrip.id)}
                        className="w-full bg-orange hover:bg-orange/90 font-black uppercase h-14"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm Load / Punch In
                      </Button>
                    )}

                    {activeTrip.status === "EnRouteToDropoff" && (
                      <Button 
                        onClick={() => handlePunchOutDelivery(activeTrip.id)}
                        className="w-full bg-active hover:bg-active/90 font-black uppercase h-14"
                      >
                        <Square className="w-4 h-4 mr-2 fill-white" />
                        Confirm Delivery / Punch Out
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground space-y-2">
                  <ClipboardList className="w-8 h-8 mx-auto opacity-20" />
                  <p className="text-xs uppercase font-bold">No Active Trip Dispatched</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="border-navy bg-navy/10 font-bold uppercase text-[10px] h-12">
              <Coffee className="w-4 h-4 mr-2 text-orange" />
              Start Break
            </Button>
            <Button variant="outline" className="border-navy bg-navy/10 font-bold uppercase text-[10px] h-12">
              <Fuel className="w-4 h-4 mr-2 text-active" />
              Refuel Log
            </Button>
          </div>

          <Button 
            onClick={handleEndShift}
            variant="destructive" 
            className="w-full h-14 font-black uppercase"
          >
            End Full Shift
          </Button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Shift Time", value: "04:22", icon: Clock },
          { label: "Load Count", value: "3", icon: Truck },
          { label: "Safety", value: "9.8", icon: Star },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel p-4 text-center">
            <stat.icon className="w-4 h-4 mx-auto mb-2 text-orange opacity-50" />
            <p className="text-[9px] font-black uppercase text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-mono font-bold tracking-tighter">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
