
"use client"

import React, { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ShieldAlert, CheckCircle2, Info, Clock, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"

export default function AlertsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const alertsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, "alerts"), where("status", "==", "active"), limit(20)) : null, [db, user])
  const { data: activeAlerts, isLoading: isAlertsLoading } = useCollection(alertsQuery)

  const historyQuery = useMemoFirebase(() => (db && user) ? query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(10)) : null, [db, user])
  const { data: historyLogs } = useCollection(historyQuery)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-emergency flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
            Safety & Alerts Terminal
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Security breach monitoring and active hazard logging</p>
        </div>
        <Button variant="outline" className="border-emergency/30 text-emergency hover:bg-emergency/10 text-xs uppercase font-bold">
          <BellOff className="w-4 h-4 mr-2" /> Silence All Alerts
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Active Incidents</h3>
          {[
            ...(activeAlerts || [])
          ].map((alert) => (
            <Card key={alert.id} className={`glass-panel border-l-4 ${
              alert.severity === 'high' || alert.severity === 'CRITICAL' ? 'border-emergency' : 
              alert.severity === 'medium' || alert.severity === 'WARNING' ? 'border-orange' : 
              'border-navy'
            }`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${
                    alert.severity === 'high' || alert.severity === 'CRITICAL' ? 'bg-emergency/10 text-emergency animate-pulse' : 
                    alert.severity === 'medium' || alert.severity === 'WARNING' ? 'bg-orange/10 text-orange' : 
                    'bg-navy/10 text-muted-foreground'
                  }`}>
                    {alert.severity === 'high' || alert.severity === 'CRITICAL' ? <ShieldAlert className="w-5 h-5" /> : 
                     alert.severity === 'medium' || alert.severity === 'WARNING' ? <AlertCircle className="w-5 h-5" /> : 
                     <Info className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold tracking-tighter text-muted-foreground">{alert.id.substring(0,6).toUpperCase()}</span>
                      <Badge className={
                        alert.severity === 'high' || alert.severity === 'CRITICAL' ? 'bg-emergency/20 text-emergency border-emergency/30' : 
                        alert.severity === 'medium' || alert.severity === 'WARNING' ? 'bg-orange/20 text-orange border-orange/30' : 
                        'bg-navy/20 text-muted-foreground border-navy'
                      }>
                        {alert.type || alert.severity}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm uppercase tracking-tight">{alert.msg || alert.message}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Zone: {alert.zone} • Timestamp: {alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleTimeString() : 'Recent'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button size="sm" variant="outline" className="text-[10px] uppercase font-bold border-navy">Dismiss</Button>
                   <Button size="sm" className="text-[10px] uppercase font-bold bg-navy/40 hover:bg-orange">Deploy Support</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!activeAlerts || activeAlerts.length === 0) && !isAlertsLoading && (
            <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
               <CheckCircle2 className="w-10 h-10 text-active opacity-40 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No Active Incidents Detected</p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="p-4 bg-navy/10 border-b border-navy/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-active" />
                History Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-navy/20">
                {historyLogs?.map((log) => (
                  <div key={log.id} className="p-4 flex items-center gap-3 hover:bg-navy/5 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-active opacity-50" />
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground truncate max-w-[150px]">{log.type || 'Event Logs'}</p>
                      <p className="text-[9px] uppercase font-medium text-white/60">{log.action || 'Operations Nominal'}</p>
                    </div>
                  </div>
                ))}
                {(!historyLogs || historyLogs.length === 0) && (
                  <div className="p-8 text-center text-[9px] font-black uppercase text-muted-foreground">No Logs Archived</div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
