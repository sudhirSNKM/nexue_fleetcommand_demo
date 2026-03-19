"use client"

import React, { useMemo } from "react"
import FleetStats from "@/components/dashboard/FleetStats"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"

export default function FleetPage() {
  const db = useFirestore()
  const { user } = useUser()

  const assetsQuery = useMemoFirebase(() => db ? query(collection(db, "fleetAssets"), orderBy("id", "asc")) : null, [db])
  const { data: assets, isLoading } = useCollection(assetsQuery)

  const ridesQuery = useMemoFirebase(() => db ? query(collection(db, "rides"), limit(50)) : null, [db])
  const { data: rides } = useCollection(ridesQuery)

  const driversQuery = useMemoFirebase(() => db ? query(collection(db, "userProfiles"), limit(50)) : null, [db])
  const { data: allUsers } = useCollection(driversQuery)

  const stats = useMemo(() => {
    const active = rides?.filter(r => !['Completed', 'Paid', 'Cancelled', 'Rejected'].includes(r.status)).length || 0
    const online = allUsers?.filter(u => u.role === 'driver' && u.status === 'Online').length || 0
    const revenue = rides?.filter(r => r.status === 'Paid').reduce((acc, r) => acc + (Number(r.fare) || 0), 0) || 0
    return { active, online, revenue }
  }, [rides, allUsers])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Fleet Registry Matrix</h1>
          <p className="text-sm text-muted-foreground">Full tactical inventory of all operational assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-navy text-xs uppercase font-bold">
            <Filter className="w-3 h-3 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="border-navy text-xs uppercase font-bold">
            <Download className="w-3 h-3 mr-2" /> Export
          </Button>
        </div>
      </div>

      <FleetStats 
        activeTrips={stats.active}
        onlineDrivers={stats.online}
        revenue={stats.revenue}
      />

      <Card className="glass-panel overflow-hidden">
        <CardHeader className="p-4 bg-navy/20 border-b border-navy/20">
          <CardTitle className="text-sm font-black uppercase">Asset Manifest</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-navy/30 text-muted-foreground uppercase tracking-wider">
                <th className="p-4 font-bold border-r border-navy/20">Asset ID</th>
                <th className="p-4 font-bold border-r border-navy/20">Type</th>
                <th className="p-4 font-bold border-r border-navy/20">Status</th>
                <th className="p-4 font-bold border-r border-navy/20">Location</th>
                <th className="p-4 font-bold border-r border-navy/20">Payload</th>
                <th className="p-4 font-bold">Next Service</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/20 font-medium">
              {(assets && assets.length > 0) ? assets.map((row, i) => (
                <tr key={i} className="hover:bg-navy/10 transition-colors group">
                  <td className="p-4 font-mono font-bold tracking-tighter text-sm">{row.id}</td>
                  <td className="p-4">{row.type}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full animate-pulse bg-current",
                        row.status === 'Active' ? 'text-active' :
                        row.status === 'Service' ? 'text-orange' :
                        row.status === 'Emergency' ? 'text-emergency' : 'text-idle'
                      )} />
                      <span className={cn(
                        "font-bold uppercase text-[10px]",
                        row.status === 'Active' ? 'text-active' :
                        row.status === 'Service' ? 'text-orange' :
                        row.status === 'Emergency' ? 'text-emergency' : 'text-idle'
                      )}>{row.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{row.loc || row.location || 'Off Grid'}</td>
                  <td className="p-4">
                    <div className="w-24 h-1.5 bg-navy/30 rounded-full overflow-hidden">
                      <div className="h-full bg-orange" style={{ width: row.payload || '0%' }} />
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-[9px] uppercase border-navy text-muted-foreground font-bold">
                      {row.service || 'Nominal'}
                    </Badge>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="p-10 text-center text-[10px] font-black uppercase text-white/40 tracking-widest">
                      {isLoading ? "Synchronizing Asset Data..." : "Fleet Registry Empty"}
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
