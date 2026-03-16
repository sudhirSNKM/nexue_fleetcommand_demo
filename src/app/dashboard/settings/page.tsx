
"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings, Shield, Bell, Cpu, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter">System Configuration</h1>
        <p className="text-sm text-muted-foreground">Adjust tactical parameters and security protocols</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="space-y-2">
           {[
             { icon: Settings, label: "General Admin", active: true },
             { icon: Shield, label: "Security Protocols", active: false },
             { icon: Bell, label: "Notification Nodes", active: false },
             { icon: Database, label: "Data Management", active: false },
           ].map((item, i) => (
             <button 
               key={i} 
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                 item.active ? 'bg-orange text-white shadow-lg' : 'text-muted-foreground hover:bg-navy/20 hover:text-white'
               }`}
             >
               <item.icon className="w-4 h-4" />
               {item.label}
             </button>
           ))}
        </aside>

        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Fleet Command Parameters</CardTitle>
              <CardDescription className="text-xs">Adjust core operational thresholds for the entire fleet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Command Post Name</Label>
                  <Input defaultValue="Nexus Primary" className="bg-navy/20 border-navy text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">System ID</Label>
                  <Input defaultValue="NX-COMMAND-01" className="bg-navy/20 border-navy text-sm font-mono" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-navy/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Auto-Redeploy Assets</p>
                    <p className="text-[10px] text-muted-foreground">Enable AI-driven fleet redistribution</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Emergency Override</p>
                    <p className="text-[10px] text-muted-foreground">Allow remote engine kill in safety breaches</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-navy/10 border-t border-navy/20 p-4">
               <Button className="ml-auto bg-orange hover:bg-orange/90 font-black uppercase text-xs">Commit Changes</Button>
            </CardFooter>
          </Card>

          <Card className="glass-panel border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase text-emergency">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Factory Protocol Reset</p>
                  <p className="text-[10px] text-muted-foreground">Wipe all operational data and driver logs</p>
                </div>
                <Button variant="destructive" size="sm" className="font-black uppercase text-[10px]">Initiate Purge</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
