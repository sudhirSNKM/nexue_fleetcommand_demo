
"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, 
  ChevronLeft, 
  ShieldAlert, 
  Send, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Edit3,
  Camera,
  Upload,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, addDoc, query, where, orderBy, limit, serverTimestamp, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function DriverProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const requestsQuery = useMemoFirebase(() => 
    user && db ? query(
      collection(db, "profileUpdateRequests"), 
      where("userId", "==", user.uid),
      orderBy("requestedAt", "desc"),
      limit(1)
    ) : null, 
  [user, db])
  
  const { data: requests } = useCollection(requestsQuery)
  const activeRequest = requests?.[0]

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    vehicleType: "",
    phone: ""
  })
  const [proofText, setProofText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        vehicleType: profile.vehicleType || "Cab",
        phone: profile.phone || ""
      })
    }
  }, [profile])

  const handleRequestAccess = async () => {
    if (!user || !db) return
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "profileUpdateRequests"), {
        userId: user.uid,
        userName: profile?.name || "Unknown Operator",
        role: "driver",
        status: "pending",
        requestedAt: serverTimestamp(),
      })
      toast({
        title: "Request Sent",
        description: "Your request to update your profile has been sent to the Admin.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitChanges = async () => {
    if (!user || !db || !activeRequest) return
    if (!proofText) {
      toast({
        variant: "destructive",
        title: "Proof Required",
        description: "Please provide proof or justification for the changes.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const requestRef = doc(db, "profileUpdateRequests", activeRequest.id)
      await updateDoc(requestRef, {
        status: "submitted",
        requestedChanges: formData,
        proofNotes: proofText,
        submittedAt: serverTimestamp(),
      })
      toast({
        title: "Changes Submitted",
        description: "Your profile changes and proof have been submitted for final review.",
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBanner = () => {
    if (!activeRequest) return null
    
    switch (activeRequest.status) {
      case 'pending':
        return (
          <div className="bg-orange/10 border border-orange/20 p-4 rounded-xl flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-orange animate-pulse" />
            <div>
              <p className="text-xs font-black uppercase text-orange">Update Request Pending</p>
              <p className="text-[10px] text-orange/60 font-bold">Waiting for Admin to grant access.</p>
            </div>
          </div>
        )
      case 'granted':
        return (
          <div className="bg-active/10 border border-active/20 p-4 rounded-xl flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-active" />
            <div>
              <p className="text-xs font-black uppercase text-active">Access Granted</p>
              <p className="text-[10px] text-active/60 font-bold">You can now update your profile details.</p>
            </div>
          </div>
        )
      case 'submitted':
        return (
          <div className="bg-navy/40 border border-white/10 p-4 rounded-xl flex items-center gap-3 mb-6">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-black uppercase text-white">Changes Under Review</p>
              <p className="text-[10px] text-muted-foreground font-bold">Admin is verifying your submitted proof.</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-charcoal text-white p-4 pb-24 font-body">
      <div className="command-grid-overlay opacity-30" />
      
      <header className="flex items-center gap-4 mb-8 z-10 relative">
        <Link href="/driver" className="w-10 h-10 rounded-xl bg-navy/40 border border-white/5 flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Profile Terminal</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Identity & Credentials Management</p>
        </div>
      </header>

      <div className="max-w-md mx-auto space-y-6 z-10 relative">
        {renderStatusBanner()}

        <Card className="glass-panel border-none overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-orange/20 to-navy" />
          <CardContent className="p-6 pt-0 -mt-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-charcoal overflow-hidden shadow-2xl mb-4 relative group">
                <img 
                  src={profile?.avatarUrl || `https://picsum.photos/seed/${user?.uid}/200/200`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white opacity-60" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-black uppercase">{profile?.name || "Unit Operator"}</h2>
              <Badge variant="outline" className="mt-1 border-orange/40 text-orange uppercase font-black text-[9px] tracking-widest px-3 py-0.5">
                {profile?.role || "Driver"}
              </Badge>
              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                 <div className="p-3 bg-navy/20 rounded-xl border border-white/5">
                   <p className="text-[8px] uppercase font-black text-muted-foreground mb-1">Total Trips</p>
                   <p className="text-sm font-bold font-mono">1,204</p>
                 </div>
                 <div className="p-3 bg-navy/20 rounded-xl border border-white/5">
                   <p className="text-[8px] uppercase font-black text-muted-foreground mb-1">Safety Rating</p>
                   <p className="text-sm font-bold font-mono">4.92</p>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-none">
          <CardHeader className="p-6 border-b border-white/5 bg-navy/10">
            <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange" /> Operational Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Full Legal Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  readOnly={!isEditing}
                  className={`${!isEditing ? 'bg-navy/10 border-transparent text-white/60' : 'bg-navy/40 border-white/10 text-white'} font-bold`}
                 />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Contact Email</Label>
                <Input 
                  value={formData.email} 
                  readOnly={true} // Email usually not changeable for auth reasons
                  className="bg-navy/10 border-transparent text-white/40 font-mono"
                 />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Vehicle Class</Label>
                <Input 
                  value={formData.vehicleType} 
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  readOnly={!isEditing}
                  className={`${!isEditing ? 'bg-navy/10 border-transparent text-white/60' : 'bg-navy/40 border-white/10 text-white'} font-bold`}
                 />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Phone Number</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  readOnly={!isEditing}
                  className={`${!isEditing ? 'bg-navy/10 border-transparent text-white/60' : 'bg-navy/40 border-white/10 text-white'} font-bold`}
                 />
              </div>
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-white/5 space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-orange flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Proof Documentation
                  </Label>
                  <Textarea 
                    placeholder="Provide details of changes and a link to proof (e.g. Google Drive link to DL or Vehicle Reg)"
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    className="bg-navy/40 border-orange/20 text-white h-24 text-xs font-medium"
                  />
                  <div className="flex items-center gap-2 p-3 bg-orange/5 border border-dashed border-orange/20 rounded-xl text-[9px] text-orange/60 font-medium">
                    <Upload className="w-4 h-4" />
                    Upload Scan (Work in Progress - Use field above)
                  </div>
                </div>
              </motion.div>
            )}

            {!isEditing ? (
              <>
                {(!activeRequest || activeRequest.status === 'approved') && (
                  <Button 
                    onClick={handleRequestAccess}
                    disabled={isSubmitting}
                    className="w-full bg-orange text-white font-black uppercase text-[10px] h-12 shadow-lg shadow-orange/20 border-none mt-4"
                  >
                    <Send className="w-4 h-4 mr-2" /> Request Profile Update
                  </Button>
                )}
                
                {activeRequest?.status === 'granted' && (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-active text-white font-black uppercase text-[10px] h-12 shadow-lg shadow-active/20 border-none mt-4"
                  >
                    <Edit3 className="w-4 h-4 mr-2" /> Change Profile
                  </Button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="h-12 border-white/10 text-white font-black uppercase text-[10px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitChanges}
                  disabled={isSubmitting}
                  className="h-12 bg-active text-white font-black uppercase text-[10px] shadow-lg shadow-active/20"
                >
                  Submit for Approval
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
