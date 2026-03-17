
"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Lock, Mail, User, UserPlus, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("passenger")
  const [vehicleType, setVehicleType] = useState("Bike")
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const profileData: any = {
        id: user.uid,
        name,
        email,
        role, 
        status: role === "driver" ? "Pending" : "Active",
        walletBalance: role === "passenger" ? 500 : 0,
        rating: 5.0,
        createdAt: serverTimestamp(),
      }

      if (role === "driver") {
        profileData.vehicleType = vehicleType
      }

      await setDoc(doc(db, "userProfiles", user.uid), profileData)

      toast({
        title: "Terminal Initialized",
        description: role === "driver" ? "Step 1 complete. Now provide vehicle details." : `Welcome, ${name}. Your account is active.`,
      })

      if (role === "driver") {
        router.push("/onboarding/vehicle-details")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Provisioning Failed",
        description: error.message || "Could not initialize terminal link.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-charcoal p-4 overflow-hidden relative">
      <div className="command-grid-overlay opacity-40" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange mb-4 shadow-[0_0_30px_rgba(255,128,0,0.3)]">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Personnel Provisioning</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Initialize New Tactical Link</p>
        </div>

        <Card className="glass-panel border-navy/30">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold uppercase tracking-tight">Access Initialization</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Define identity and operational clearance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Operator Designation" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 bg-navy/20 border-navy/50 h-11 text-sm font-medium focus:ring-orange/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Terminal ID (Email)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="email@nexus-fleet.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-navy/20 border-navy/50 h-11 text-sm font-medium focus:ring-orange/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Security Key (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-navy/20 border-navy/50 h-11 text-sm font-medium focus:ring-orange/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Operational Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-navy/20 border-navy/50 h-11 text-sm font-medium">
                    <SelectValue placeholder="Select Clearance Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-navy text-white">
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="driver">Operator (Driver)</SelectItem>
                    <SelectItem value="admin">Logistics Admin</SelectItem>
                    <SelectItem value="super-admin">Command High Staff (Super Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "driver" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Initial Vehicle Class</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="bg-navy/20 border-navy/50 h-11 text-sm font-medium">
                      <SelectValue placeholder="Select Unit Class" />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-navy text-white">
                      <SelectItem value="Bike">Bike (Unit Scout)</SelectItem>
                      <SelectItem value="Auto">Auto (Unit Pulse)</SelectItem>
                      <SelectItem value="Cab">Cab (Unit Prime)</SelectItem>
                      <SelectItem value="Truck">Truck (Heavy Transport)</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(255,128,0,0.2)]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initializing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Finalize Identity
                  </div>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-[10px] uppercase font-bold text-orange hover:underline underline-offset-4">
                Already registered? Return to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
