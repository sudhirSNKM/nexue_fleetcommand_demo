
"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  User, 
  Shield, 
  Lock, 
  LogOut, 
  Bell, 
  Globe,
  Settings,
  ShieldCheck,
  Key
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function AdminAccountPage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Personnel Terminal</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Authorized Admin Identity Management</p>
        </div>
        <div className="flex items-center gap-2 bg-orange/10 border border-orange/20 px-4 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-orange" />
          <span className="text-[9px] font-black text-orange uppercase tracking-widest">Admin Clearance Level 2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="space-y-4">
          <Card className="glass-panel border-none p-6 text-center">
            <div className="w-24 h-24 mx-auto relative mb-4">
              <img 
                src={`https://picsum.photos/seed/${user?.uid}/200/200`} 
                alt="Profile" 
                className="w-full h-full rounded-2xl object-cover ring-2 ring-orange/50 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange rounded-lg flex items-center justify-center shadow-lg">
                <Settings className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-black text-white uppercase">{profile?.name}</h3>
            <p className="text-[9px] text-orange font-black uppercase tracking-[0.2em] mt-1">{profile?.role}</p>
            <Badge variant="outline" className="mt-4 border-white/10 text-white/40 font-black uppercase text-[8px]">Sector: {profile?.zone || 'Global'}</Badge>
          </Card>

          <Button 
            onClick={handleLogout}
            variant="destructive" 
            className="w-full h-12 bg-emergency/10 border border-emergency/20 text-emergency font-black uppercase text-[10px] tracking-widest hover:bg-emergency hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" /> Abort Session
          </Button>
        </aside>

        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-none">
            <CardHeader className="p-6 border-b border-white/5 bg-navy/10">
              <CardTitle className="text-xs font-black uppercase text-white/60 flex items-center gap-2">
                <User className="w-4 h-4 text-orange" /> Identity Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Designation Name</Label>
                  <Input defaultValue={profile?.name} className="bg-navy/40 border-white/10 text-white font-bold h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Contact Link (Email)</Label>
                  <Input defaultValue={profile?.email} readOnly className="bg-navy/20 border-white/5 text-white/40 font-mono h-11" />
                </div>
              </div>
              <Button className="bg-orange text-white font-black uppercase text-[10px] h-11 px-8 shadow-lg shadow-orange/20 border-none">
                Update Identity
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none">
            <CardHeader className="p-6 border-b border-white/5 bg-navy/10">
              <CardTitle className="text-xs font-black uppercase text-white/60 flex items-center gap-2">
                <Key className="w-4 h-4 text-orange" /> Security Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Current Security Key</Label>
                  <Input type="password" placeholder="••••••••" className="bg-navy/40 border-white/10 text-white h-11" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black text-white/40 ml-1">New Security Key</Label>
                    <Input type="password" placeholder="••••••••" className="bg-navy/40 border-white/10 text-white h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Confirm Protocol</Label>
                    <Input type="password" placeholder="••••••••" className="bg-navy/40 border-white/10 text-white h-11" />
                  </div>
                </div>
              </div>
              <Button variant="outline" className="border-white/10 text-white font-black uppercase text-[10px] h-11 px-8 hover:bg-white/5">
                Revoke & Cycle Keys
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
