"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Lock, Mail, User, UserPlus, Phone, Key, ArrowRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp, getDocs, query, collection, where } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("passenger")
  const [vehicleType, setVehicleType] = useState("Bike")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone || !password) {
      toast({ variant: "destructive", title: "Incomplete Data", description: "All identity parameters are required." })
      return
    }
    setStep('otp')
    toast({ title: "OTP Transmitted", description: "Verification code sent to your comms link. (Use 1234)" })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp !== "1234") {
      toast({ variant: "destructive", title: "Invalid Protocol", description: "Incorrect verification code." })
      return
    }

    setIsLoading(true)
    try {
      // 1. Check for pre-provisioned roles (e.g. provisioned admin)
      const q = query(collection(db, "userProfiles"), where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(q)
      
      let finalRole = role
      let finalStatus = role === "driver" ? "pending" : "Active"
      
      if (!querySnapshot.empty) {
        const existingData = querySnapshot.docs[0].data()
        // If they were pre-provisioned as admin, keep that role
        if (existingData.role === 'admin' || existingData.role === 'super-admin') {
          finalRole = existingData.role
          finalStatus = "Active"
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const profileData: any = {
        id: user.uid,
        name,
        email: email.toLowerCase(),
        phone: phone.trim(),
        role: finalRole, 
        status: finalStatus,
        walletBalance: finalRole === "passenger" ? 500 : 0,
        rating: 0, 
        createdAt: serverTimestamp(),
      }

      if (finalRole === "driver") {
        profileData.vehicleType = vehicleType
      }

      await setDoc(doc(db, "userProfiles", user.uid), profileData)

      toast({
        title: "Terminal Initialized",
        description: finalRole === "driver" ? "Step 1 complete. Now provide vehicle details." : `Welcome, ${name}. Your account is active.`,
      })

      if (finalRole === "driver") {
        router.push("/onboarding/vehicle-details")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Provision Failed",
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
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Personnel Provisioning</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Initialize New Tactical Link</p>
        </div>

        <Card className="glass-panel border-navy/30">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold uppercase tracking-tight">
              {step === 'form' ? 'Access Initialization' : 'Identify Verification'}
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">
              {step === 'form' ? 'Define identity and operational clearance' : 'Enter the tactical code sent to your link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-4"
                >
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Email Link</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="email@nexus.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 bg-navy/20 border-navy/50 h-11 text-sm font-medium focus:ring-orange/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Phone Link</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          placeholder="+91 XXXXX XXXXX" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="pl-10 bg-navy/20 border-navy/50 h-11 text-sm font-medium focus:ring-orange/50"
                        />
                      </div>
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
                    className="w-full h-12 bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(255,128,0,0.2)]"
                  >
                    Send Verification OTP <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Verification Code</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="XXXX" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={4}
                        className="pl-10 bg-navy/20 border-navy/50 h-14 text-2xl tracking-[1em] text-center font-black focus:ring-orange/50"
                      />
                    </div>
                    <p className="text-[9px] text-orange font-bold uppercase text-center mt-2">Default debugging code: 1234</p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs shadow-lg"
                  >
                    {isLoading ? "Provisioning..." : "Finalize Identity"}
                  </Button>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setStep('form')}
                    className="w-full text-[10px] font-black uppercase text-white/40 hover:text-white"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" /> Re-enter Parameters
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

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
