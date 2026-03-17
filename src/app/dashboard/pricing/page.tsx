
"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  DollarSign, 
  Zap, 
  TrendingUp, 
  Clock, 
  Layers, 
  Edit, 
  Save, 
  ArrowRight,
  Bike,
  Zap as AutoIcon,
  Car,
  Truck
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

const VEHICLE_CLASSES = [
  { id: 'Bike', name: 'Bike (Unit Scout)', icon: Bike, base: 25, km: 5 },
  { id: 'Auto', name: 'Auto (Unit Pulse)', icon: AutoIcon, base: 45, km: 8 },
  { id: 'Cab', name: 'Cab (Unit Prime)', icon: Car, base: 80, km: 12 },
  { id: 'Truck', name: 'Truck (Heavy Transport)', icon: Truck, base: 250, km: 45 }
]

export default function PricingEnginePage() {
  const db = useFirestore()
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Pricing Engine Protocol</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Platform Revenue Control Terminal</p>
        </div>
        <div className="flex gap-4">
           <Badge className="bg-orange/20 text-orange border-orange/40 font-mono uppercase px-4 py-1">REAL-TIME CALCULATION ACTIVE</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel border-none shadow-2xl">
            <CardHeader className="p-4 bg-navy/20 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange" /> Vehicle Category Multipliers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {VEHICLE_CLASSES.map((v) => (
                  <div key={v.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-navy/40 rounded-xl flex items-center justify-center border border-white/5">
                        <v.icon className="w-6 h-6 text-orange" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">{v.name}</h4>
                        <p className="text-[10px] text-white/40 uppercase font-bold">Standard Operations Protocol</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <p className="text-[8px] text-white/20 uppercase font-black mb-1">Base Fare</p>
                        <p className="text-sm font-black text-white font-mono">₹{v.base}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-white/20 uppercase font-black mb-1">Rate / KM</p>
                        <p className="text-sm font-black text-white font-mono">₹{v.km}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-white/40 hover:text-orange">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-orange">
            <CardHeader className="p-4 bg-orange/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-orange">
                <Zap className="w-4 h-4" /> Dynamic Surge Algorithm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div>
                     <Label className="text-[9px] font-black uppercase text-white/40 mb-2 block">Maximum Surge Cap</Label>
                     <div className="flex items-center gap-3">
                       <Input defaultValue="3.5x" className="bg-navy/40 border-white/10 text-white font-mono h-11" />
                       <Badge className="bg-active/20 text-active border-active/40 font-mono">AUTO</Badge>
                     </div>
                   </div>
                   <div>
                     <Label className="text-[9px] font-black uppercase text-white/40 mb-2 block">Demand Threshold</Label>
                     <Input defaultValue="85%" className="bg-navy/40 border-white/10 text-white font-mono h-11" />
                   </div>
                </div>
                <div className="bg-navy/40 rounded-2xl p-6 border border-white/5 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase text-orange mb-2">Live Estimation</p>
                   <div className="space-y-3">
                     <div className="flex justify-between text-xs font-bold text-white/60">
                        <span>Current Network Load</span>
                        <span className="text-active font-mono">62%</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-white/60">
                        <span>Global Multiplier</span>
                        <span className="text-white font-mono">1.0x (Baseline)</span>
                     </div>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="glass-panel">
            <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange" /> Operational Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-white/40">Platform Commission</span>
                    <span className="text-sm font-black text-white font-mono">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-white/40">Insurance Levy</span>
                    <span className="text-sm font-black text-white font-mono">₹2.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-white/40">Technology Fee</span>
                    <span className="text-sm font-black text-white font-mono">₹5.00</span>
                  </div>
               </div>
               <Button className="w-full bg-orange text-white font-black uppercase text-[10px] h-11 tracking-widest shadow-lg shadow-orange/20">
                 Commit Algorithm Changes
               </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-navy">
            <CardHeader className="p-4 bg-navy/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/60" /> Peak Hour Scheduler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               {[
                 { label: "Morning Rush", time: "08:00 - 10:30", mult: "1.4x" },
                 { label: "Evening Rush", time: "17:30 - 20:30", mult: "1.6x" },
                 { label: "Night Protocol", time: "22:00 - 05:00", mult: "1.2x" }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">{item.label}</p>
                      <p className="text-[8px] font-bold text-white/40 uppercase font-mono">{item.time}</p>
                    </div>
                    <Badge variant="outline" className="border-orange/30 text-orange font-mono text-[10px]">{item.mult}</Badge>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
