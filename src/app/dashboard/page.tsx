
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import FleetStats from "@/components/dashboard/FleetStats"
import LiveMap from "@/components/dashboard/LiveMap"
import FuelAnalytics from "@/components/dashboard/FuelAnalytics"
import DriverPerformance from "@/components/dashboard/DriverPerformance"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertCircle, ShieldCheck, Timer } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function Dashboard() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [currentTime, setCurrentTime] = useState<string | null>(null)

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  useEffect(() => {
    // Set time on client side mount to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleTimeString())
    
    // Update time every second for a live dashboard feel
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isProfileLoading && profile) {
      if (profile.role === "Driver") {
        router.push("/dashboard/driver")
      } else if (profile.role === "Passenger") {
        router.push("/dashboard/passenger")
      }
    }
  }, [profile, isProfileLoading, router])

  if (isUserLoading || isProfileLoading || (profile && profile.role !== "Admin" && profile.role !== "Super Admin")) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-charcoal">
        <div className="w-8 h-8 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Command Control Terminal</h1>
          <p className="text-sm text-muted-foreground">
            Fleet status: <span className="text-active font-bold">OPERATIONAL</span> | 
            Current Time: <span className="font-mono">{currentTime || "--:--:--"}</span>
          </p>
        </div>
        <FleetStats />
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Col: Map (Takes 2/3 space) */}
        <div className="xl:col-span-2 min-h-[500px]">
          <LiveMap />
        </div>

        {/* Right Col: Alerts & Activities */}
        <div className="space-y-6">
          <Card className="glass-panel border-l-4 border-emergency overflow-hidden">
            <CardHeader className="p-4 flex flex-row items-center gap-2 border-b border-navy/20 bg-emergency/5">
              <AlertCircle className="w-5 h-5 text-emergency animate-pulse" />
              <CardTitle className="text-sm font-black uppercase text-emergency">Critical Alerts (3)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3 bg-emergency/10 rounded-md border border-emergency/20 animate-slide-up">
                  <div className="w-1.5 h-auto bg-emergency rounded-full" />
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide">Vehicle TR-404: Engine Overheat</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Zone: West Expressway • 4 mins ago</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden">
            <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange" />
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-navy/20">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 hover:bg-navy/10 transition-colors flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-navy/30 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-active" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold">Driver #4402 started Trip #8812</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Timestamp: 14:22:11</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FuelAnalytics />
        <DriverPerformance />
      </section>

      {/* High Density Table Section */}
      <section>
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="p-4 bg-navy/20 border-b border-navy/20 flex flex-row justify-between items-center">
             <CardTitle className="text-sm font-black uppercase">Fleet Registry Matrix</CardTitle>
             <button className="text-[10px] font-bold uppercase text-orange hover:underline">Export Telemetry</button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-navy/30 text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 font-bold border-r border-navy/20">Vehicle ID</th>
                  <th className="p-4 font-bold border-r border-navy/20">Driver Name</th>
                  <th className="p-4 font-bold border-r border-navy/20">Telemetry Status</th>
                  <th className="p-4 font-bold border-r border-navy/20">Fuel (%)</th>
                  <th className="p-4 font-bold border-r border-navy/20">Est. Arrival</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/20">
                {[
                  { id: "NX-8822", driver: "Command Pilot Alpha", status: "In Transit", fuel: 82, eta: "14:50", color: "text-active" },
                  { id: "NX-1049", driver: "Operator Bravo", status: "Docking", fuel: 14, eta: "Arrived", color: "text-idle" },
                  { id: "NX-3301", driver: "Courier Delta", status: "Maintenance", fuel: 0, eta: "N/A", color: "text-orange" },
                  { id: "NX-9928", driver: "Logistics Lead", status: "Emergency", fuel: 45, eta: "Unknown", color: "text-emergency" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-navy/10 transition-colors group">
                    <td className="p-4 font-mono font-bold tracking-tighter text-sm">{row.id}</td>
                    <td className="p-4 font-medium">{row.driver}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse bg-current ${row.color}`} />
                        <span className={`font-bold uppercase text-[10px] ${row.color}`}>{row.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-navy/30 rounded-full overflow-hidden">
                          <div className={`h-full ${row.fuel < 20 ? 'bg-emergency' : 'bg-active'}`} style={{ width: `${row.fuel}%` }} />
                        </div>
                        <span className="font-bold">{row.fuel}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">{row.eta}</td>
                    <td className="p-4">
                       <button className="px-3 py-1 bg-navy/40 border border-navy/20 rounded hover:bg-orange hover:text-white transition-all text-[10px] uppercase font-bold">Tactical View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
