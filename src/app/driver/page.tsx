
"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Square, 
  MapPin, 
  Camera, 
  CreditCard, 
  User, 
  Star,
  Fuel
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function DriverMobileApp() {
  const [isTripActive, setIsTripActive] = useState(false)

  return (
    <div className="min-h-screen bg-charcoal text-foreground p-4 pb-24 font-body">
      <div className="command-grid-overlay opacity-30" />
      
      {/* Driver Header */}
      <header className="flex items-center justify-between mb-8 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full ring-2 ring-orange/40 overflow-hidden">
            <img src="https://picsum.photos/seed/driver/100/100" alt="Driver" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Alex Hunt</h1>
            <div className="flex items-center gap-1 text-orange text-xs font-bold">
              <Star className="w-3 h-3 fill-orange" />
              4.9 Safety Score
            </div>
          </div>
        </div>
        <Badge className="bg-active/20 text-active border-active/40">Verified</Badge>
      </header>

      {/* Main Action Card */}
      <motion.div layout>
        <Card className={`glass-panel border-none relative overflow-hidden transition-all duration-500 ${isTripActive ? 'ring-2 ring-active shadow-[0_0_20px_rgba(0,204,0,0.2)]' : ''}`}>
          <CardContent className="p-6">
            {!isTripActive ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-navy/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                   <Play className="w-8 h-8 text-orange" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Ready for Duty?</h2>
                <p className="text-sm text-muted-foreground">Ensure vehicle inspection is complete before starting.</p>
                <Button 
                  onClick={() => setIsTripActive(true)}
                  className="w-full bg-orange hover:bg-orange/90 text-white font-black h-14 rounded-xl text-lg uppercase tracking-wider"
                >
                  Start New Trip
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-active rounded-full animate-pulse" />
                     <span className="text-xs font-bold uppercase tracking-widest text-active">Active Trip #8841</span>
                   </div>
                   <span className="text-2xl font-mono font-bold">01:24:12</span>
                </div>

                <div className="p-4 bg-navy/20 rounded-xl border border-white/5 space-y-4">
                   <div className="flex items-start gap-3">
                     <MapPin className="w-5 h-5 text-orange mt-1" />
                     <div>
                       <p className="text-[10px] uppercase text-muted-foreground font-bold">Destination</p>
                       <p className="text-sm font-bold">Logistics Hub - Sector 7</p>
                       <p className="text-xs text-muted-foreground">Approx. 4.2 miles away</p>
                     </div>
                   </div>
                   <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span>Progress</span>
                        <span>72%</span>
                      </div>
                      <Progress value={72} className="h-1.5 bg-navy/40" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <Button variant="outline" className="h-12 border-navy text-xs uppercase font-bold tracking-wider">
                     <Camera className="w-4 h-4 mr-2" /> 
                     Log Issue
                   </Button>
                   <Button variant="outline" className="h-12 border-navy text-xs uppercase font-bold tracking-wider">
                     <Fuel className="w-4 h-4 mr-2 text-orange" /> 
                     Fuel Up
                   </Button>
                </div>

                <Button 
                  onClick={() => setIsTripActive(false)}
                  variant="destructive"
                  className="w-full h-14 rounded-xl text-lg font-black uppercase tracking-wider"
                >
                  <Square className="w-5 h-5 mr-3 fill-white" />
                  End Trip
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <section className="mt-8 z-10 relative">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Past Operations</h3>
        <div className="space-y-3">
           {[1, 2].map((i) => (
             <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase">Fuel Expense Logged</p>
                    <p className="text-[10px] text-muted-foreground">Sept 12, 2024 • $142.00</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-active border-active/30 text-[9px] uppercase">Approved</Badge>
             </div>
           ))}
        </div>
      </section>

      {/* Driver Tabs (Fixed Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-panel border-t border-white/10 z-50 flex items-center justify-around px-6">
        <button className="flex flex-col items-center gap-1 text-orange">
          <Play className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Trip</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-muted-foreground">
          <MapPin className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Routes</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-muted-foreground">
          <CreditCard className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Expenses</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-muted-foreground">
          <User className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  )
}
