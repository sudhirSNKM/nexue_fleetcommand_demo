
"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Truck, ShieldCheck, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { collection, query, where, getDocs, limit, doc, updateDoc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const isEmail = /^\S+@\S+\.\S+$/.test(identifier.trim())
      let emailToUse = identifier.toLowerCase().trim()

      if (!isEmail) {
        // Phone number entered: query Firestore to resolve the email
        const q = query(collection(db, "userProfiles"), where("phone", "==", identifier.trim()), limit(1))
        const snap = await getDocs(q)
        if (snap.empty) {
          throw new Error("No personnel record found for this phone number.")
        }
        emailToUse = snap.docs[0].data().email
      }

<<<<<<< HEAD
      await signInWithEmailAndPassword(auth, emailToUse, password)
      const user = auth.currentUser!;
      
      const userDocRef = doc(db, "userProfiles", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists() && userSnap.data().currentSessionId) {
        // Log trace of override but proceed with new session
=======
      // Direct Firebase Auth handshake — no pre-auth Firestore lookup needed for email
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password)
      const user = userCredential.user

      // Session Security Protocol: Generate and synchronize unique session identifier
      const { updateDoc, getDoc } = await import("firebase/firestore")
      const userDocRef = doc(db, "userProfiles", user.uid)
      const userSnap = await getDoc(userDocRef)

      if (userSnap.exists() && userSnap.data().currentSessionId) {
        toast({
          title: "Session Override detected",
          description: "An active link was detected elsewhere. Overriding for new tactical session.",
        })
>>>>>>> 0c7c111fd6dd7bdffda3ed2ac380e9980d318cef
      }

      const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem("nexus_terminal_session", newSessionId)
      await updateDoc(userDocRef, { currentSessionId: newSessionId })

      router.push("/dashboard")
    } catch (error: any) {
      // Map Firebase Auth errors to user-friendly messages
      let message = error.message || "Invalid credentials provided."
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Invalid email or password. Please verify your credentials."
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please wait and try again."
      }
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: message,
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
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Command Entry</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Authorized Personnel Only</p>
        </div>

        <Card className="glass-panel border-navy/30">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold uppercase tracking-tight">Security Handshake</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Verify credentials to initialize terminal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Email or Phone Number" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="pl-10 bg-navy/20 border-navy/50 h-12 text-sm font-medium focus:ring-orange/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Security Key" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-navy/20 border-navy/50 h-12 text-sm font-medium focus:ring-orange/50"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(255,128,0,0.2)]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Initialize Link
                  </div>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/register" className="text-[10px] uppercase font-bold text-orange hover:underline underline-offset-4">
                Register a new tactical terminal
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
