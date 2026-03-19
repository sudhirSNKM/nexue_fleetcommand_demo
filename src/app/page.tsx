
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Truck, Zap } from "lucide-react"
import { useUser } from "@/firebase"

export default function Home() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    if (isUserLoading) return;
    if (user) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [user, isUserLoading, router])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-charcoal text-foreground overflow-hidden">
      <div className="command-grid-overlay opacity-40" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "circOut" }}
        className="text-center z-10"
      >
        <div className="relative mb-10">
          <motion.div 
            animate={{ 
              boxShadow: ["0 0 20px #FF8000", "0 0 60px #FF8000", "0 0 20px #FF8000"],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 bg-orange rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl relative z-10"
          >
            <Truck className="w-12 h-12 text-white" />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter uppercase mb-2 flex items-center justify-center gap-2">
          Fleet<span className="text-orange">OS</span>
        </h1>
        <p className="text-white/40 uppercase tracking-[0.6em] text-[10px] font-black">Tactical Deployment System v4.0.2</p>
        
        <div className="mt-16 w-72 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden relative border border-white/5">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-orange to-transparent shadow-[0_0_15px_#FF8000]"
          />
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold mb-4">Initializing Secure Comms Layer</p>
        <div className="flex justify-center gap-8 text-[8px] font-black text-white/10 uppercase tracking-widest">
          <span>Encrypted (E2EE)</span>
          <span>Sync Active</span>
          <span>Mesh Secure</span>
        </div>
      </div>
    </div>
  )
}
