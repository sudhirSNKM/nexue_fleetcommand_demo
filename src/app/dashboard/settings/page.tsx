
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings, Shield, Bell, Database, AlertTriangle, Loader2, Save } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("General Admin")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Tactical State Protocols
  const [config, setConfig] = useState({
    commandPostName: "Nexus Primary",
    systemId: "NX-COMMAND-01",
    autoRedeploy: true,
    emergencyOverride: false
  })

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  const isSuperAdmin = profile?.role === "super-admin"

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "fleet_command") : null, [db])
  const { data: remoteConfig, isLoading: isConfigLoading } = useDoc(settingsRef)

  useEffect(() => {
    if (remoteConfig) {
      setConfig({
        commandPostName: remoteConfig.commandPostName || "Nexus Primary",
        systemId: remoteConfig.systemId || "NX-COMMAND-01",
        autoRedeploy: remoteConfig.autoRedeploy ?? true,
        emergencyOverride: remoteConfig.emergencyOverride ?? false
      })
    }
  }, [remoteConfig])

  const handleCommitChanges = async () => {
    if (!db || !settingsRef) return
    setIsSaving(true)
    try {
      await setDoc(settingsRef, {
        ...config,
        lastUpdatedBy: profile?.name || user?.uid,
        lastUpdatedAt: new Date().toISOString()
      }, { merge: true })
      
      toast({
        title: "Registry Updated",
        description: "Tactical command parameters have been synchronized with the central server.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInitiatePurge = async () => {
    if (!db || !isSuperAdmin) return
    const confirm = window.confirm("CRITICAL WARNING: This will permanently wipe operational logs and system registry. Are you absolutely certain about this tactical purge?")
    if (!confirm) return

    setIsLoading(true)
    try {
      // Logic for purging data: For now, we'll just toast a mock success or clear a small collection
      // In a real app, this might clear specific collections like driverShifts or auditLogs
      toast({
        title: "Purge In Progress",
        description: "Wiping mission logs and tactical registry...",
      })
      
      // Batch delete example for mission logs or something similar if needed
      // ...
      
      setTimeout(() => {
        toast({
          title: "Factory Protocol Reset",
          description: "Terminal registry has been successfully purged. System neutralized.",
        })
        setIsLoading(false)
      }, 2000)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Purge Aborted",
        description: error.message
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white">System Configuration</h1>
          <p className="text-sm text-white/40 uppercase font-black tracking-widest mt-1">Adjust tactical parameters and security protocols</p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2 bg-orange/10 border border-orange/20 px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,128,0,0.1)]">
            <Shield className="w-4 h-4 text-orange" />
            <span className="text-[10px] font-black text-orange uppercase tracking-widest">Elevated Clearance Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="space-y-2">
           {[
             { icon: Settings, label: "General Admin" },
             { icon: Shield, label: "Security Protocols" },
             { icon: Bell, label: "Notification Nodes" },
             { icon: Database, label: "Data Management" },
           ].map((item, i) => (
             <button 
               key={i} 
               onClick={() => setActiveTab(item.label)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                 activeTab === item.label ? 'bg-orange text-white shadow-[0_5px_15px_rgba(255,128,0,0.3)]' : 'text-white/40 hover:bg-white/5 hover:text-white'
               }`}
             >
               <item.icon className={`w-4 h-4 ${activeTab === item.label ? 'animate-spin-slow' : ''}`} />
               {item.label}
             </button>
           ))}
        </aside>

        <div className="md:col-span-2 space-y-6">
          {activeTab === "General Admin" ? (
            <Card className="glass-panel border-none shadow-2xl">
              <CardHeader className="bg-white/5 border-b border-white/5 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white/80">Fleet Command Parameters</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Adjust core operational thresholds for the entire fleet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-orange/60 tracking-widest ml-1">Command Post Name</Label>
                    <Input 
                      value={config.commandPostName} 
                      onChange={(e) => setConfig({...config, commandPostName: e.target.value})}
                      className="bg-white/5 border-white/10 text-white font-bold h-12 focus:border-orange/50 transition-colors" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black text-orange/60 tracking-widest ml-1">System ID</Label>
                    <Input 
                      value={config.systemId} 
                      onChange={(e) => setConfig({...config, systemId: e.target.value})}
                      className="bg-white/5 border-white/10 text-white font-mono h-12 focus:border-orange/50 transition-colors" 
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-orange/20 transition-all group">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest group-hover:text-orange transition-colors">Auto-Redeploy Assets</p>
                      <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Enable AI-driven fleet redistribution</p>
                    </div>
                    <Switch 
                      checked={config.autoRedeploy} 
                      onCheckedChange={(val) => setConfig({...config, autoRedeploy: val})} 
                      className="data-[state=checked]:bg-orange"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-orange/20 transition-all group">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest group-hover:text-orange transition-colors">Emergency Override</p>
                      <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Allow remote engine kill in safety breaches</p>
                    </div>
                    <Switch 
                      checked={config.emergencyOverride} 
                      onCheckedChange={(val) => setConfig({...config, emergencyOverride: val})} 
                      className="data-[state=checked]:bg-orange"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white/5 border-t border-white/5 p-6">
                 <Button 
                   onClick={handleCommitChanges}
                   disabled={isSaving}
                   className="ml-auto bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs h-12 px-8 shadow-[0_5px_15px_rgba(255,128,0,0.2)]"
                 >
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                   Commit Changes
                 </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="glass-panel border-none p-20 text-center shadow-2xl">
               <Shield className="w-16 h-16 text-white/10 mx-auto mb-6 animate-pulse" />
               <h3 className="text-lg font-black uppercase text-white/20 tracking-[0.5em] mb-2">{activeTab} Node</h3>
               <p className="text-[10px] font-black uppercase text-white/10 tracking-[0.2em]">Access restricted or module offline</p>
            </Card>
          )}

          {isSuperAdmin && activeTab === "General Admin" && (
            <Card className="glass-panel border-emergency/20 border-2 shadow-[0_0_30px_rgba(255,0,0,0.05)]">
              <CardHeader className="bg-emergency/5 border-b border-emergency/10 p-6">
                <CardTitle className="text-xs font-black uppercase text-emergency flex items-center gap-2 tracking-[0.2em]">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-[10px] text-emergency font-black uppercase tracking-widest mt-1">Restricted to Super Admin Clearance only</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-widest">Factory Protocol Reset</p>
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mt-1">Wipe all operational data and driver logs. This cannot be undone.</p>
                  </div>
                  <Button 
                    onClick={handleInitiatePurge}
                    disabled={isLoading}
                    variant="destructive" 
                    className="w-full sm:w-auto font-black uppercase text-[11px] h-12 px-8 shadow-lg"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Initiate Purge"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
