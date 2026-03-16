
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Truck } from "lucide-react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-charcoal text-foreground">
      <div className="command-grid-overlay" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10"
      >
        <div className="w-24 h-24 bg-orange rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(255,128,0,0.3)]">
          <Truck className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
          Nexus <span className="text-orange">FleetCommand</span>
        </h1>
        <p className="text-muted-foreground uppercase tracking-[0.4em] text-sm">Initializing Tactical Interface</p>
        
        <div className="mt-12 w-64 h-1 bg-navy/30 rounded-full mx-auto overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-orange"
          />
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        Secure Handshake | Auth Protocol v4.0.2
      </div>
    </div>
  )
}
