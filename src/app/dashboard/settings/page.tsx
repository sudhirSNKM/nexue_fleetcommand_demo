
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  AlertTriangle, 
  Loader2, 
  Save, 
  Lock, 
  Globe, 
  Clock, 
  ShieldAlert,
  Zap,
  Activity,
  History,
  FileDown,
  Trash2
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    emergencyOverride: false,
    enforce2FA: true,
    sessionExpiry: "12h",
    regionalLock: false,
    alertMissions: true,
    alertPersonnel: false,
    alertHealth: true,
    backupCycle: "Daily",
    retentionDays: 90
  })

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  const isSuperAdmin = profile?.role === "super-admin"

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "fleet_command") : null, [db])
  const { data: remoteConfig, isLoading: isConfigLoading } = useDoc(settingsRef)

  useEffect(() => {
    if (remoteConfig) {
      setConfig(prev => ({
        ...prev,
        ...remoteConfig
      }))
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
      toast({
        title: "Purge In Progress",
        description: "Wiping mission logs and tactical registry...",
      })
      
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "General Admin":
        return (
          <div className="space-y-6">
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
          </div>
        )
      case "Security Protocols":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-orange" />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Enforce Multi-Factor Auth</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Mandatory 2FA for all administrative logins</p>
                </div>
              </div>
              <Switch 
                checked={config.enforce2FA} 
                onCheckedChange={(val) => setConfig({...config, enforce2FA: val})} 
                className="data-[state=checked]:bg-orange"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-orange" />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Global Session Expiry</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Automatic terminal lockout duration</p>
                </div>
              </div>
              <Select value={config.sessionExpiry} onValueChange={(val) => setConfig({...config, sessionExpiry: val})}>
                <SelectTrigger className="w-[120px] bg-navy/40 border-white/10 text-xs font-bold uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-white/10 text-white text-xs uppercase font-bold">
                  <SelectItem value="2h">2 Hours</SelectItem>
                  <SelectItem value="12h">12 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="Persistent">Persistent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-orange" />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Regional IP Lock</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Restrict access to verified sector IP ranges</p>
                </div>
              </div>
              <Switch 
                checked={config.regionalLock} 
                onCheckedChange={(val) => setConfig({...config, regionalLock: val})} 
                className="data-[state=checked]:bg-orange"
              />
            </div>
          </div>
        )
      case "Notification Nodes":
        return (
          <div className="space-y-6">
            {[
              { id: 'alertMissions', label: "High-Priority Mission Alerts", desc: "Real-time broadcast for tactical exceptions", icon: Zap },
              { id: 'alertPersonnel', label: "Personnel Access Logs", desc: "Notify on administrative login events", icon: Activity },
              { id: 'alertHealth', label: "Infrastructure Health Heartbeat", desc: "Hourly diagnostic summary of system nodes", icon: ShieldAlert }
            ].map((node) => (
              <div key={node.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <node.icon className="w-5 h-5 text-orange" />
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">{node.label}</p>
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">{node.desc}</p>
                  </div>
                </div>
                <Switch 
                  checked={(config as any)[node.id]} 
                  onCheckedChange={(val) => setConfig({...config, [node.id]: val})} 
                  className="data-[state=checked]:bg-orange"
                />
              </div>
            ))}
          </div>
        )
      case "Data Management":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <History className="w-5 h-5 text-orange" />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Automated Backup Cycle</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Frequency of encrypted state snapshots</p>
                </div>
              </div>
              <Select value={config.backupCycle} onValueChange={(val) => setConfig({...config, backupCycle: val})}>
                <SelectTrigger className="w-[120px] bg-navy/40 border-white/10 text-xs font-bold uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-white/10 text-white text-xs uppercase font-bold">
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-orange" />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Mission Log Retention</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Days to keep mission data before archiving</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  value={config.retentionDays} 
                  onChange={(e) => setConfig({...config, retentionDays: parseInt(e.target.value)})}
                  className="w-20 bg-navy/40 border-white/10 text-white font-mono h-9 text-xs text-center" 
                />
                <span className="text-[10px] font-black text-white/40 uppercase">Days</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                <FileDown className="w-4 h-4 mr-2 text-active" /> Export Full Audit JSON
              </Button>
              <Button variant="outline" className="h-12 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-emergency/10 hover:text-emergency transition-colors">
                <Trash2 className="w-4 h-4 mr-2" /> Clear Temporary Cache
              </Button>
            </div>
          </div>
        )
      default:
        return null
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
          <Card className="glass-panel border-none shadow-2xl">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white/80">{activeTab} Interface</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Adjusting operational thresholds for the {activeTab.toLowerCase()} cluster.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {renderTabContent()}
            </CardContent>
            <CardFooter className="bg-white/5 border-t border-white/5 p-6">
               <Button 
                 onClick={handleCommitChanges}
                 disabled={isSaving}
                 className="ml-auto bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs h-12 px-8 shadow-[0_5px_15px_rgba(255,128,0,0.2)]"
               >
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                 Commit {activeTab} Changes
               </Button>
            </CardFooter>
          </Card>

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
