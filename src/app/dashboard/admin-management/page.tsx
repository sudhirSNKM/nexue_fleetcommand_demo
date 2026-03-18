"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Lock, 
  Activity, 
  MoreVertical,
  Mail,
  MapPin,
  ShieldAlert,
  Zap,
  User
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function AdminManagementPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', zone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const adminsQuery = useMemoFirebase(() => query(
    collection(db, "userProfiles"), 
    where("role", "==", "admin")
  ), [db])

  const { data: admins, isLoading } = useCollection(adminsQuery)

  const handleStatusToggle = (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active'
    updateDocumentNonBlocking(doc(db, "userProfiles", adminId), { status: newStatus })
    toast({
      title: "Clearance Level Updated",
      description: `Admin status synchronized to ${newStatus}.`,
    })
  }

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Logic to provision a new admin profile directly in Firestore
      const adminId = `admin_${Date.now()}`
      const adminRef = doc(db, "userProfiles", adminId)
      
      await setDoc(adminRef, {
        id: adminId,
        name: newAdmin.name,
        email: newAdmin.email,
        zone: newAdmin.zone,
        role: 'admin',
        status: 'Active',
        createdAt: serverTimestamp()
      })

      toast({ 
        title: "Provision Successful", 
        description: `${newAdmin.name} added to administrative registry.` 
      })
      setIsDialogOpen(false)
      setNewAdmin({ name: '', email: '', zone: '' })
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Provision Failed", 
        description: error.message 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Staff Provisioning</h1>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Operations Admin & Access Controls</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange text-white font-black uppercase text-[10px] h-11 px-6 shadow-lg shadow-orange/20 border-none">
                <UserPlus className="w-4 h-4 mr-2" /> Provision New Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange" /> Admin Authorization
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold text-white/40">
                  Provision new administrative credentials for the platform registry.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProvision} className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Personnel Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input 
                        placeholder="Operator Name" 
                        value={newAdmin.name}
                        onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                        required
                        className="pl-10 bg-navy/20 border-white/10 h-11 text-sm font-bold focus:ring-orange/50" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Network ID (Email)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input 
                        type="email"
                        placeholder="admin@nexus-fleet.com" 
                        value={newAdmin.email}
                        onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                        required
                        className="pl-10 bg-navy/20 border-white/10 h-11 text-sm font-bold focus:ring-orange/50" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black text-white/40 ml-1">Assigned Sector (Zone)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input 
                        placeholder="Sector ID" 
                        value={newAdmin.zone}
                        onChange={e => setNewAdmin({...newAdmin, zone: e.target.value})}
                        required
                        className="pl-10 bg-navy/20 border-white/10 h-11 text-sm font-bold focus:ring-orange/50" 
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-orange hover:bg-orange/90 text-white font-black uppercase text-xs h-12 shadow-lg"
                  >
                    {isSubmitting ? "Processing..." : "Authorize Personnel"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <Card className="glass-panel border-none shadow-2xl">
            <CardHeader className="p-4 bg-navy/20 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase text-white/60 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange" /> Operational Administrators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {isLoading ? (
                  <div className="p-10 text-center text-white/20 animate-pulse font-black uppercase text-xs">Accessing Personnel Files...</div>
                ) : admins?.map((admin) => (
                  <div key={admin.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-white/5 shadow-2xl">
                        <AvatarImage src={`https://picsum.photos/seed/${admin.id}/100/100`} />
                        <AvatarFallback className="bg-navy text-white font-black">{admin.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">{admin.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[9px] font-black uppercase text-white/40 tracking-widest">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {admin.email}</span>
                          <span className="flex items-center gap-1 text-orange"><MapPin className="w-3 h-3" /> {admin.zone || 'Global Sector'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase px-3 py-1",
                        admin.status === 'Active' ? "bg-active/10 text-active border-active/20" : "bg-emergency/10 text-emergency border-emergency/20"
                      )}>
                        {admin.status || 'Active'}
                      </Badge>
                      <Button 
                        onClick={() => handleStatusToggle(admin.id, admin.status || 'Active')}
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-black uppercase text-white/40 hover:text-orange"
                      >
                        {admin.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </div>
                  </div>
                ))}
                {!admins?.length && !isLoading && (
                  <div className="p-20 text-center opacity-20">
                    <Lock className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-black uppercase">No regional administrators provisioned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="glass-panel border-none p-6 bg-navy/20 relative overflow-hidden group">
            <ShieldAlert className="absolute -right-4 -bottom-4 w-24 h-24 text-orange opacity-5 group-hover:opacity-10 transition-opacity" />
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Security Overview</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 font-black uppercase">Active Admins</span>
                <span className="text-white font-mono font-black">{admins?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 font-black uppercase">Failed Sign-ins</span>
                <span className="text-emergency font-mono font-black">0</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                <span className="text-white/60 font-black uppercase">Last Audit Pulse</span>
                <span className="text-active font-mono font-black">Now</span>
              </div>
            </div>
          </Card>

          <Button variant="outline" className="w-full h-14 border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/5">
            <Activity className="w-4 h-4 mr-3" /> View Global Audit Trail
          </Button>
        </aside>
      </div>
    </div>
  )
}
