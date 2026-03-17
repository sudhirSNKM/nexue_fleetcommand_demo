"use client"

import React, { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  User, 
  Car, 
  Shield, 
  TrendingUp, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  History,
  Activity,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase, 
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase"
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function DriverProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const driverId = params.driverId as string

  const [activeTimeframe, setActiveTimeframe] = useState("today")

  // FETCH DRIVER PROFILE
  const profileRef = useMemoFirebase(() => db ? doc(db, "userProfiles", driverId) : null, [db, driverId])
  const { data: driver, isLoading: isProfileLoading } = useDoc(profileRef)

  // FETCH RIDE HISTORY
  const ridesQuery = useMemoFirebase(() => db ? query(
    collection(db, "rides"), 
    where("driverId", "==", driverId),
    orderBy("createdAt", "desc"),
    limit(50)
  ) : null, [db, driverId])
  const { data: rides } = useCollection(ridesQuery)

  // FETCH SHIFT LOGS
  const shiftsQuery = useMemoFirebase(() => db ? query(
    collection(db, "driverShifts"),
    where("driverId", "==", driverId),
    orderBy("punchInTime", "desc"),
    limit(10)
  ) : null, [db, driverId])
  const { data: shifts } = useCollection(shiftsQuery)

  // MOCK CHART DATA (Ideally from driverStats)
  const chartData = [
    { day: 'Mon', trips: 12, earnings: 1450, hours: 8.5, rating: 4.8 },
    { day: 'Tue', trips: 15, earnings: 1890, hours: 9.2, rating: 4.9 },
    { day: 'Wed', trips: 10, earnings: 1200, hours: 7.0, rating: 4.7 },
    { day: 'Thu', trips: 18, earnings: 2100, hours: 10.5, rating: 5.0 },
    { day: 'Fri', trips: 14, earnings: 1650, hours: 8.0, rating: 4.8 },
    { day: 'Sat', trips: 22, earnings: 2800, hours: 12.0, rating: 4.9 },
    { day: 'Sun', trips: 8, earnings: 900, hours: 5.5, rating: 4.6 },
  ]

  const metrics = useMemo(() => {
    if (!rides) return { totalEarnings: 0, totalTrips: 0, avgRating: 4.8, distance: 1240 }
    const totalEarnings = rides.reduce((acc, r) => acc + (r.fare || 0), 0)
    return {
      totalEarnings,
      totalTrips: rides.length,
      avgRating: driver?.rating || 4.8,
      distance: Math.floor(rides.length * 8.4)
    }
  }, [rides, driver])

  const handleStatusChange = (newStatus: string) => {
    if (!profileRef) return
    updateDocumentNonBlocking(profileRef, { status: newStatus })
    toast({
      title: "Tactical Update",
      description: `Operator status changed to ${newStatus}. Platform registry updated.`
    })
  }

  const handleDeleteAccount = () => {
    if (!profileRef) return
    if (confirm("CRITICAL: Permanent deletion of operator data initiated. Confirm authorization?")) {
      deleteDocumentNonBlocking(profileRef)
      toast({ variant: "destructive", title: "Operator Purged", description: "Account removed from tactical terminal." })
      router.push("/dashboard/drivers")
    }
  }

  if (isProfileLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-charcoal">
      <div className="w-10 h-10 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
    </div>
  )

  if (!driver) return (
    <div className="p-10 text-center text-white">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange" />
      <h2 className="text-2xl font-black uppercase">Operator Not Found</h2>
      <Button variant="link" onClick={() => router.back()} className="text-orange">Return to Directory</Button>
    </div>
  )

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Operator Command Terminal</h1>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Personnel ID: {driver.id.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {driver.status === 'Suspended' ? (
            <Button onClick={() => handleStatusChange('Active')} className="bg-active text-white font-black uppercase text-xs h-11 px-6 shadow-lg shadow-active/20 border-none">
              <UserCheck className="w-4 h-4 mr-2" /> Activate Unit
            </Button>
          ) : (
            <Button onClick={() => handleStatusChange('Suspended')} className="bg-emergency text-white font-black uppercase text-xs h-11 px-6 shadow-lg shadow-emergency/20 border-none">
              <UserX className="w-4 h-4 mr-2" /> Suspend Account
            </Button>
          )}
          <Button variant="outline" className="border-white/10 text-white font-black uppercase text-xs h-11 px-6 hover:bg-white/5">
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* SIDEBAR: OVERVIEW */}
        <div className="space-y-6">
          <Card className="glass-panel border-none shadow-2xl overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-navy to-charcoal border-b border-white/5" />
            <CardContent className="px-6 pb-6 pt-0 -mt-12 text-center">
              <Avatar className="w-24 h-24 mx-auto ring-4 ring-charcoal shadow-2xl mb-4">
                <AvatarImage src={`https://picsum.photos/seed/${driver.id}/200/200`} />
                <AvatarFallback className="bg-navy text-2xl font-black text-white">{driver.name[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-black text-white uppercase">{driver.name}</h2>
              <p className="text-[10px] text-orange font-black uppercase tracking-widest mt-1">{driver.vehicleType || 'Scout'}</p>
              
              <div className="flex justify-center gap-4 mt-6">
                <div className="text-center">
                  <p className="text-[9px] font-black text-white/30 uppercase">Rating</p>
                  <div className="flex items-center gap-1 text-orange font-black text-sm">
                    <Star className="w-3 h-3 fill-orange" /> {driver.rating || '5.0'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-white/30 uppercase">Status</p>
                  <Badge className={cn(
                    "text-[8px] font-black uppercase",
                    driver.status === 'Online' ? 'bg-active/10 text-active' : 'bg-white/5 text-white/40'
                  )}>
                    {driver.status || 'Offline'}
                  </Badge>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-left border-t border-white/5 pt-6">
                <div className="flex items-center gap-3 text-white/60">
                  <Phone className="w-4 h-4 text-orange" />
                  <span className="text-xs font-bold">{driver.phone || '+91 9988776655'}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Mail className="w-4 h-4 text-orange" />
                  <span className="text-xs font-bold truncate">{driver.email}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <MapPin className="w-4 h-4 text-orange" />
                  <span className="text-xs font-bold">{driver.zone || 'Sector 4 Depot'}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Calendar className="w-4 h-4 text-orange" />
                  <span className="text-xs font-bold">Member Since {new Date(driver.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none p-6 space-y-6">
            <h3 className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-active" /> Asset Manifest
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase mb-1">Vehicle Class</p>
                <p className="text-xs font-black text-white uppercase">{driver.vehicleType || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase mb-1">Registration #</p>
                <p className="text-xs font-black font-mono text-white/80">{driver.vehicleNumber || 'KA-01-NX-2024'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase mb-1">Insurance</p>
                  <Badge variant="outline" className="text-[9px] border-white/10 text-white/40 uppercase">EXPIRED</Badge>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase mb-1">RC Validation</p>
                  <Badge variant="outline" className="text-[9px] border-active/50 text-active uppercase">VERIFIED</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Button 
            onClick={handleDeleteAccount}
            variant="destructive" 
            className="w-full bg-emergency/10 border border-emergency/20 text-emergency font-black uppercase text-[10px] h-11 hover:bg-emergency hover:text-white transition-all"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Purge Operator
          </Button>
        </div>

        {/* MAIN CONTENT: PERFORMANCE & HISTORY */}
        <div className="xl:col-span-3 space-y-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-navy/40 p-1 rounded-xl h-14 border border-white/5">
              <TabsTrigger value="overview" className="data-[state=active]:bg-orange data-[state=active]:text-white font-black uppercase text-[10px] px-8 h-full rounded-lg transition-all">Overview</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-orange data-[state=active]:text-white font-black uppercase text-[10px] px-8 h-full rounded-lg transition-all">Mission Log</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-orange data-[state=active]:text-white font-black uppercase text-[10px] px-8 h-full rounded-lg transition-all">Documents</TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-orange data-[state=active]:text-white font-black uppercase text-[10px] px-8 h-full rounded-lg transition-all">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8 space-y-8">
              {/* METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Missions", val: metrics.totalTrips, icon: Zap, color: "text-active" },
                  { label: "Revenue", val: `₹${metrics.totalEarnings}`, icon: CreditCard, color: "text-orange" },
                  { label: "Distance", val: `${metrics.distance}km`, icon: MapPin, color: "text-white" },
                  { label: "Safety Score", val: driver.rating || 4.8, icon: Shield, color: "text-active" },
                ].map((m, i) => (
                  <Card key={i} className="glass-panel border-none p-6 bg-navy/20 relative group overflow-hidden">
                    <m.icon className={cn("absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity", m.color)} />
                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">{m.label}</p>
                    <h4 className={cn("text-2xl font-black font-mono", m.color)}>{m.val}</h4>
                  </Card>
                ))}
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-panel border-none">
                  <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
                    <CardTitle className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange" /> Earnings Pulse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF8000" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FF8000" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="day" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#131518', border: '1px solid #ffffff10', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="earnings" stroke="#FF8000" fillOpacity={1} fill="url(#colorE)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-none">
                  <CardHeader className="p-4 bg-navy/10 border-b border-white/5">
                    <CardTitle className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-active" /> Operational Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="day" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#131518', border: '1px solid #ffffff10', fontSize: '12px' }} />
                        <Bar dataKey="trips" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={index} fill={entry.trips > 15 ? '#00CC00' : '#FF8000'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-8">
              <Card className="glass-panel border-none overflow-hidden">
                <CardHeader className="p-4 bg-navy/10 border-b border-white/5 flex flex-row justify-between architecture">
                   <CardTitle className="text-[10px] font-black uppercase text-white/60 flex items-center gap-2">
                     <History className="w-4 h-4 text-orange" /> Mission Manifest
                   </CardTitle>
                   <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-white/40">View All Archive</Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-white/5 text-white/40 uppercase font-black tracking-widest text-[10px]">
                        <th className="p-4 border-r border-white/5">Mission ID</th>
                        <th className="p-4 border-r border-white/5">Origin/Target</th>
                        <th className="p-4 border-r border-white/5">Fare</th>
                        <th className="p-4 border-r border-white/5">Status</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/70 font-bold uppercase text-[10px]">
                      {rides?.map((ride) => (
                        <tr key={ride.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 font-mono tracking-tighter">{ride.id.substring(0,8)}</td>
                          <td className="p-4 max-w-[200px]">
                             <p className="truncate text-white">{ride.pickup.address}</p>
                             <p className="truncate text-white/40 text-[8px] mt-1">{ride.dropoff.address}</p>
                          </td>
                          <td className="p-4 font-mono text-orange">₹{ride.fare}</td>
                          <td className="p-4">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase",
                              ride.status === 'Paid' ? 'bg-active/10 text-active' : 'bg-orange/10 text-orange'
                            )}>
                              {ride.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-white/40">{new Date(ride.createdAt?.seconds * 1000).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!rides?.length && (
                        <tr>
                          <td colSpan={5} className="p-20 text-center text-white/10 italic">No historical missions detected in current sector.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: "Driving License", icon: User, status: "Verified" },
                  { label: "Vehicle RC", icon: Car, status: "Verified" },
                  { label: "Insurance Policy", icon: Shield, status: "Expired", critical: true },
                  { label: "Pollution Certificate", icon: FileText, status: "Verified" },
                  { label: "Aadhar/ID Proof", icon: Lock, status: "Verified" },
                ].map((doc, i) => (
                  <Card key={i} className={cn("glass-panel border-none p-6 flex flex-col items-center group relative overflow-hidden", doc.critical && "ring-1 ring-emergency/30")}>
                    <div className="p-4 rounded-full bg-navy/40 mb-4 group-hover:scale-110 transition-transform">
                      <doc.icon className={cn("w-8 h-8", doc.critical ? "text-emergency" : "text-orange")} />
                    </div>
                    <p className="text-sm font-black text-white uppercase mb-2">{doc.label}</p>
                    <Badge className={cn("text-[9px] font-black uppercase", doc.critical ? "bg-emergency text-white" : "bg-active/10 text-active")}>
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" className="mt-4 text-[9px] font-black uppercase text-white/40 hover:text-white">View File</Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="mt-8">
              <div className="space-y-4">
                {rides?.filter(r => r.rating).map((ride, i) => (
                  <Card key={i} className="glass-panel border-none p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={`https://picsum.photos/seed/${ride.passengerId}/100/100`} />
                          <AvatarFallback className="bg-navy text-[10px] font-black text-white">P</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase">Passenger ID: {ride.passengerId.substring(0,6)}</p>
                          <p className="text-[8px] text-white/40 uppercase font-bold">{new Date(ride.reviewedAt?.seconds * 1000).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={cn("w-3 h-3", j < (ride.rating || 0) ? "text-orange fill-orange" : "text-white/10")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white/80 italic leading-relaxed">
                      "Professional operator, efficient tactical navigation. Highly recommended for logistics missions in Sector 4."
                    </p>
                  </Card>
                ))}
                {!rides?.some(r => r.rating) && (
                  <div className="p-20 text-center glass-panel rounded-2xl border-none">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-white/10" />
                    <p className="text-sm font-black text-white/20 uppercase">No active feedback logs</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}