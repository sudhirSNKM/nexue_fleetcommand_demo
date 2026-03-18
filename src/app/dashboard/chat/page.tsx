
"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  User, 
  ShieldCheck, 
  MessageSquare, 
  Activity, 
  Clock, 
  Hash,
  Lock,
  Search,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, addDoc, serverTimestamp, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function AdministrativeChatPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(userProfileRef)
  const isAdmin = profile?.role === "admin" || profile?.role === "super-admin"

  // Tactical Chat Feed: Global Admin Channel
  const chatQuery = useMemoFirebase(() => db ? query(
    collection(db, "adminChats", "global_command", "messages"),
    orderBy("timestamp", "asc"),
    limit(100)
  ) : null, [db])

  const { data: messages, isLoading } = useCollection(chatQuery)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !db || !profile) return

    const messageData = {
      senderId: user.uid,
      senderName: profile.name || "Unknown Actor",
      senderRole: profile.role,
      text: newMessage.trim(),
      timestamp: serverTimestamp()
    }

    setNewMessage("")
    try {
      await addDoc(collection(db, "adminChats", "global_command", "messages"), messageData)
    } catch (error) {
      console.error("Message transmission failed:", error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-charcoal text-white">
        <ShieldCheck className="w-16 h-16 text-emergency animate-pulse" />
        <h2 className="text-xl font-black uppercase">Clearance Level Mismatch</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Secure Administrative Link Required</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            Tactical Comms Link
            <MessageSquare className="w-8 h-8 text-orange" />
          </h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Direct Secure Communication Layer</p>
        </div>
        <div className="flex items-center gap-2 bg-orange/10 border border-orange/20 px-4 py-2 rounded-full">
          <Activity className="w-4 h-4 text-orange" />
          <span className="text-[9px] font-black text-orange uppercase tracking-widest">Network Secure (E2EE)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <div className="xl:col-span-3 flex flex-col overflow-hidden">
          <Card className="glass-panel border-none flex-1 flex flex-col overflow-hidden shadow-2xl">
            <CardHeader className="p-4 bg-navy/20 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center border border-orange/20">
                  <Hash className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black uppercase text-white tracking-widest">Command Global</CardTitle>
                  <p className="text-[8px] text-active font-black uppercase">Fleet Command Center Active</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <input placeholder="Search archives..." className="bg-navy/40 border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-[10px] text-white focus:outline-none" />
                </div>
                <Lock className="w-4 h-4 text-white/20" />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
              {isLoading ? (
                <div className="h-full flex items-center justify-center opacity-20">
                  <Activity className="w-8 h-8 animate-spin" />
                </div>
              ) : messages?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                  <MessageSquare className="w-16 h-16" />
                  <p className="text-xs font-black uppercase tracking-widest">No signals detected in this sector</p>
                </div>
              ) : (
                messages?.map((msg, i) => {
                  const isMe = msg.senderId === user?.uid
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                    >
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl relative shadow-lg",
                        isMe ? "bg-orange text-white rounded-tr-none" : "bg-navy/40 border border-white/5 text-white/90 rounded-tl-none"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[8px] font-black uppercase", isMe ? "text-white/60" : "text-orange")}>
                            {msg.senderName} • {msg.senderRole}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                        <span className={cn("text-[7px] font-mono mt-2 block", isMe ? "text-white/40" : "text-white/20")}>
                          {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </CardContent>

            <div className="p-4 bg-navy/20 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Transmit tactical intelligence..." 
                  className="bg-navy/40 border-white/10 text-white font-medium h-12 rounded-xl focus:ring-orange/50"
                />
                <Button type="submit" className="bg-orange hover:bg-orange/90 text-white w-12 h-12 rounded-xl p-0 shadow-lg shadow-orange/20 border-none shrink-0">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 hidden xl:block">
          <Card className="glass-panel border-none p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Users className="w-5 h-5 text-orange" />
              <h3 className="text-[10px] font-black uppercase text-white tracking-widest">Active Commanders</h3>
            </div>
            <div className="space-y-4">
               {[
                 { name: "Sector Admin Prime", status: "Online", role: "Super Admin", avatar: "A" },
                 { name: "Logistics Lead", status: "Away", role: "Admin", avatar: "L" },
                 { name: profile?.name, status: "Online", role: profile?.role, avatar: "ME" },
               ].map((comm, i) => (
                 <div key={i} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-navy/40 flex items-center justify-center border border-white/5 text-[10px] font-black group-hover:border-orange transition-colors">
                      {comm.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase truncate">{comm.name}</p>
                      <p className="text-[8px] text-white/40 uppercase font-bold">{comm.role}</p>
                    </div>
                    <span className={cn("w-1.5 h-1.5 rounded-full", comm.status === 'Online' ? 'bg-active' : 'bg-white/20')} />
                 </div>
               ))}
            </div>
          </Card>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-orange" />
               <span className="text-[10px] font-black uppercase text-white">Comms Protocol</span>
             </div>
             <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed">
               All message logs are immutable and archived for audit. Unauthorized data leakage will trigger immediate unit suspension.
             </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
