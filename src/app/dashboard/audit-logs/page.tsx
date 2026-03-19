
"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  Activity, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Shield, 
  Server,
  Database,
  Lock,
  Download
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function AuditLogsPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const logsQuery = useMemoFirebase(() => (db && user) ? query(
    collection(db, "auditLogs"), 
    orderBy("timestamp", "desc"),
    limit(100)
  ) : null, [db, user])

  const { data: logs, isLoading } = useCollection(logsQuery)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">System Audit Pulse</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Immutable Immutable Governance Logs</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-white/10 text-white font-black uppercase text-[10px] h-11 px-6 hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" /> Export JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="glass-panel border-none shadow-2xl overflow-hidden">
            <CardHeader className="p-4 bg-navy/20 border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase text-white/60 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange" /> Governance Matrix
              </CardTitle>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange transition-colors" />
                <input 
                  placeholder="Filter by Action/User..." 
                  className="bg-navy/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-orange/50 transition-all w-64"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy/30 text-white/40 uppercase font-black tracking-widest text-[10px]">
                    <th className="p-4 border-r border-white/5">Timestamp</th>
                    <th className="p-4 border-r border-white/5">Actor ID</th>
                    <th className="p-4 border-r border-white/5">Tactical Action</th>
                    <th className="p-4">System Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white font-bold uppercase text-[10px]">
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="p-4"><div className="h-4 bg-white/5 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : logs?.map((log, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-white/40">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</td>
                      <td className="p-4 font-mono text-orange">{log.userId?.substring(0, 12)}...</td>
                      <td className="p-4 text-white">{log.action}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[8px] border-white/10 text-white/40 font-black">SYSTEM_KERNEL</Badge>
                      </td>
                    </tr>
                  ))}
                  {!logs?.length && !isLoading && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-muted-foreground italic">No system events logged in current reporting phase.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel border-none p-6 bg-navy/20">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-6">Kernel Nodes</p>
            <div className="space-y-6">
              {[
                { label: "Auth Bridge", icon: Lock, status: "Secure", color: "text-active" },
                { label: "Firestore Sync", icon: Database, status: "Nominal", color: "text-active" },
                { label: "API Gateway", icon: Server, status: "Active", color: "text-active" },
                { label: "Admin Shield", icon: Shield, status: "Armed", color: "text-orange" },
              ].map((node, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <node.icon className={cn("w-4 h-4", node.color)} />
                    <span className="text-[10px] font-black uppercase text-white/70">{node.label}</span>
                  </div>
                  <span className={cn("text-[9px] font-black uppercase", node.color)}>{node.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <Clock className="w-4 h-4 text-orange" />
               <span className="text-[10px] font-black uppercase text-white">Retention Protocol</span>
             </div>
             <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed">
               Logs are archived for 90 days as per global governance compliance. Emergency purging restricted to Super Admin only.
             </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
