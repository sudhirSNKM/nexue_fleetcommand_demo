
"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, 
  ShieldAlert, 
  Send, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Edit3,
  Camera,
  Upload,
  AlertCircle,
  Mail,
  Phone,
  Layout,
  Car,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Eye,
  RefreshCw,
  XCircle,
  MessageSquare
} from "lucide-react"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { doc, collection, addDoc, query, where, orderBy, limit, serverTimestamp, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth, useStorage } from "@/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { signOut } from "firebase/auth"

export default function UniversalProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const storage = useStorage()
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
  const [requestReason, setRequestReason] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleType: "",
    zone: ""
  })
  const [proofText, setProofText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const role = (profile?.role || "passenger").toLowerCase()
  const isMobilityUser = role === "passenger" || role === "driver"

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        vehicleType: profile.vehicleType || "",
        zone: profile.zone || ""
      })
    }
  }, [profile])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const handleRequestAccess = async () => {
    if (!user || !db) return
    if (!requestReason.trim()) {
      toast({
        variant: "destructive",
        title: "Justification Required",
        description: "Please specify what you intend to update and why.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "profileUpdateRequests"), {
        userId: user.uid,
        userName: profile?.name || "Unknown Identity",
        role: role,
        status: "pending",
        initialReason: requestReason,
        requestedAt: serverTimestamp(),
      })
      toast({
        title: "Request Sent",
        description: "Your request to authorize profile modifications has been logged.",
      })
      setRequestReason("")
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
        description: "Please provide justification or verification proof for the changes.",
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
        description: "Profile updates and proof have been submitted for sector review.",
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file || !user || !db || !storage) return

    // Protocol Integrity: Ensure update access has been granted by Command
    if (activeRequest?.status !== 'granted') {
      toast({
        variant: "destructive",
        title: "Protocol Breach",
        description: "You must have an approved 'Initiate Protocol Update' to modify document archives.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const fileRef = ref(storage, `documents/${user.uid}/${docType}`)
      
      // Stage 1: Storage Handshake
      console.log(`[STORAGE] Initiating upload for: ${docType} (File: ${file.name}, Size: ${file.size}b)`);
      const snapshot = await uploadBytes(fileRef, file)
      console.log(`[STORAGE] Bytes uploaded successfully for: ${docType}`);
      
      const downloadURL = await getDownloadURL(fileRef)
      console.log(`[STORAGE] Resolved download URL: ${docType}`);

      // Stage 2: Registry Sync
      const docPath = `docs.${docType}`
      await updateDoc(doc(db, "userProfiles", user.uid), {
        [docPath]: {
          url: downloadURL,
          status: "pending",
          uploadedAt: serverTimestamp(),
          fileName: file.name
        }
      })
      console.log(`[REGISTRY] Document record updated: ${docType}`);

      toast({
        title: "Document Logged",
        description: `${docType.toUpperCase()} is now pending tactical verification.`,
      })
    } catch (error: any) {
      console.error(`[STORAGE_FAILURE] Protocol error for ${docType}:`, error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "A storage link error occurred during document logging.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBanner = () => {
    if (!activeRequest || activeRequest.status === 'approved') return null
    
    const bannerConfig: any = {
      pending: {
        bg: isMobilityUser ? "bg-orange/5" : "bg-orange/10",
        border: "border-orange/20",
        text: "text-orange",
        icon: Clock,
        title: "Authorization Pending",
        desc: "Waiting for Command Clearance to modify data."
      },
      granted: {
        bg: isMobilityUser ? "bg-green-50" : "bg-active/10",
        border: isMobilityUser ? "border-green-100" : "border-active/20",
        text: isMobilityUser ? "text-green-600" : "text-active",
        icon: ShieldCheck,
        title: "Update Access Active",
        desc: "You have been cleared to modify your identity parameters."
      },
      submitted: {
        bg: isMobilityUser ? "bg-slate-50" : "bg-white/5",
        border: isMobilityUser ? "border-slate-200" : "border-white/10",
        text: isMobilityUser ? "text-slate-600" : "text-white/60",
        icon: FileText,
        title: "Protocol Review Active",
        desc: "Admin is verifying your submitted justification."
      }
    }

    const config = bannerConfig[activeRequest.status]
    if (!config) return null

    const Icon = config.icon
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("p-4 rounded-2xl flex items-center gap-4 mb-8 border transition-colors", config.bg, config.border)}
      >
        <div className={cn("p-2 rounded-xl", config.bg)}>
          <Icon className={cn("w-5 h-5", config.text, activeRequest.status === 'pending' && "animate-pulse")} />
        </div>
        <div>
          <p className={cn("text-[10px] font-black uppercase tracking-widest", config.text)}>{config.title}</p>
          <p className={cn("text-[9px] font-bold uppercase mt-0.5 opacity-60", config.text)}>{config.desc}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn("max-w-4xl mx-auto space-y-8 pb-20", isMobilityUser ? "text-slate-900" : "text-white")}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
             <User className="w-8 h-8 text-orange" />
             Identity Management
          </h1>
          <p className={cn("text-[10px] uppercase font-black tracking-[0.4em] mt-2", isMobilityUser ? "text-slate-400" : "text-white/40")}>
            Certified Member of Nexus Command
          </p>
        </div>
        
        <div className="flex gap-4">
           {isMobilityUser ? (
             <Card className="px-6 py-2 border-l-4 border-orange bg-white shadow-sm flex flex-col justify-center">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Global Rating</p>
               <p className="text-xl font-black text-slate-900">{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</p>
             </Card>
           ) : (
             <div className="flex items-center gap-2 bg-orange/10 border border-orange/20 px-4 py-2 rounded-full">
                <ShieldCheck className="w-4 h-4 text-orange" />
                <span className="text-[9px] font-black text-orange uppercase tracking-widest">High Command Clearance</span>
             </div>
           )}
        </div>
      </header>

      {renderStatusBanner()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="space-y-6">
           <Card className={cn("border-none overflow-hidden", isMobilityUser ? "bg-white shadow-xl" : "glass-panel")}>
              <div className={cn("h-24", isMobilityUser ? "bg-slate-100" : "bg-gradient-to-r from-orange/20 to-navy")} />
              <CardContent className="p-6 pt-0 -mt-12 text-center">
                <div className="w-24 h-24 rounded-2xl ring-4 ring-white overflow-hidden shadow-2xl mx-auto mb-4 relative group">
                  <img src={`https://picsum.photos/seed/${user?.uid}/200/200`} alt="Avatar" className="w-full h-full object-cover" />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer">
                      <Camera className="w-8 h-8 text-white opacity-60" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-black uppercase">{profile?.name || "Member UN-01"}</h3>
                <Badge variant="outline" className={cn("mt-2 border-orange/40 text-orange uppercase font-black text-[10px] tracking-widest px-4", !isMobilityUser && "bg-orange/5")}>
                  {profile?.role}
                </Badge>
                
                {!isMobilityUser && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-white/40">Sector ID</span>
                      <span className="text-white font-mono">{user?.uid.substring(0,8)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-white/40">Last Pulse</span>
                      <span className="text-active">Now</span>
                    </div>
                  </div>
                )}
              </CardContent>
           </Card>

           <Button 
            onClick={handleLogout}
            variant="ghost"
            className={cn("w-full h-12 font-black uppercase text-[10px] tracking-widest", isMobilityUser ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground hover:text-emergency hover:bg-emergency/10")}
          >
            <LogOut className="w-4 h-4 mr-3" /> Abort Session
          </Button>
        </aside>

        <div className="md:col-span-2 space-y-8">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className={cn("inline-flex h-12 items-center justify-start rounded-xl p-1 mb-6", isMobilityUser ? "bg-slate-200/50" : "bg-navy/40")}>
              <TabsTrigger 
                value="details" 
                className={cn(
                  "rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange data-[state=active]:text-white transition-all",
                  isMobilityUser ? "text-slate-600" : "text-white/60"
                )}
              >
                Protocol Details
              </TabsTrigger>
              {role === 'driver' && (
                <TabsTrigger 
                  value="documents" 
                  className={cn(
                    "rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange data-[state=active]:text-white transition-all",
                    isMobilityUser ? "text-slate-600" : "text-white/60"
                  )}
                >
                  Document Vault
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="audit" 
                className={cn(
                  "rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange data-[state=active]:text-white transition-all",
                  isMobilityUser ? "text-slate-600" : "text-white/60"
                )}
              >
                Audit Trail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-8">
               <Card className={cn("border-none shadow-2xl", isMobilityUser ? "bg-white" : "glass-panel")}>
                  <CardHeader className={cn("p-6 border-b", isMobilityUser ? "bg-slate-50 border-slate-100" : "bg-navy/10 border-white/5")}>
                    <CardTitle className="text-xs font-black uppercase flex items-center gap-3">
                       <ShieldAlert className="w-5 h-5 text-orange" />
                       Core Protocol Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <Label className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-500" : "text-white/50")}>Full Legal Identity</Label>
                           <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            readOnly={!isEditing}
                            className={cn(
                              "h-12 font-bold", 
                              isMobilityUser ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-navy/40 border-white/10 text-white",
                              !isEditing && "opacity-50 cursor-not-allowed border-transparent"
                            )} 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-500" : "text-white/50")}>Link (Email)</Label>
                           <Input value={profile?.email || ""} readOnly className={cn("h-12 font-mono", isMobilityUser ? "bg-slate-50 border-transparent text-slate-500" : "bg-navy/20 border-transparent text-white/40")} />
                        </div>

                        <div className="space-y-2">
                           <Label className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-500" : "text-white/50")}>Emergency Comms (Phone)</Label>
                           <Input 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            readOnly={!isEditing}
                            className={cn(
                              "h-12 font-bold", 
                              isMobilityUser ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-navy/40 border-white/10 text-white",
                              !isEditing && "opacity-50 cursor-not-allowed border-transparent"
                            )} 
                           />
                        </div>

                        {role === 'driver' && (
                          <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-500" : "text-white/50")}>Assigned Vehicle Class</Label>
                            <Input 
                              value={formData.vehicleType}
                              onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                              readOnly={!isEditing}
                              className={cn(
                                "h-12 font-bold", 
                                isMobilityUser ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-navy/40 border-white/10 text-white",
                                !isEditing && "opacity-50 cursor-not-allowed border-transparent"
                              )} 
                            />
                          </div>
                        )}

                        {(role === 'admin' || role === 'super-admin') && (
                          <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase tracking-widest", isMobilityUser ? "text-slate-500" : "text-white/50")}>Operational Sector (Zone)</Label>
                            <Input 
                              value={formData.zone}
                              onChange={(e) => setFormData({...formData, zone: e.target.value})}
                              readOnly={!isEditing}
                              className={cn(
                                "h-12 font-bold", 
                                isMobilityUser ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-navy/40 border-white/10 text-white",
                                !isEditing && "opacity-50 cursor-not-allowed border-transparent"
                              )} 
                            />
                          </div>
                        )}
                     </div>

                     {!isEditing && (!activeRequest || activeRequest.status === 'approved') && (
                       <div className="space-y-4 pt-6 border-t border-dashed border-white/10">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-orange flex items-center gap-2">
                               <MessageSquare className="w-4 h-4" /> Tactical Justification (What are you changing?)
                             </Label>
                             <Textarea 
                                value={requestReason}
                                onChange={(e) => setRequestReason(e.target.value)}
                                placeholder="State clearly what needs to be updated (e.g., Change Phone Number, Update Vehicle class to Cab...)"
                                className={cn(
                                  "min-h-[80px] text-xs font-medium focus:ring-orange/50",
                                  isMobilityUser ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-navy/40 border-white/10 text-white"
                                )}
                             />
                          </div>
                       </div>
                     )}

                     <AnimatePresence>
                        {isEditing && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 pt-6 border-t border-slate-100"
                          >
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-orange flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" /> Hardened Justification (Proof)
                                </Label>
                                <Textarea 
                                   value={proofText}
                                   onChange={(e) => setProofText(e.target.value)}
                                   placeholder="Provide legal reason for update and links to verification images/docs..."
                                   className={cn(
                                     "min-h-[100px] text-xs font-medium focus:ring-orange/50",
                                     isMobilityUser ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-navy/40 border-orange/20 text-white"
                                   )}
                                />
                             </div>
                             <div className={cn("p-4 rounded-xl border border-dashed flex items-center justify-between", isMobilityUser ? "bg-slate-50 border-slate-200" : "bg-orange/5 border-orange/20")}>
                                <div className="flex items-center gap-3">
                                   <Upload className="w-5 h-5 text-orange" />
                                   <span className="text-[10px] font-black uppercase text-orange/60">Upload Scan Manifest</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase">Browse Files</Button>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>

                     <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        {!isEditing ? (
                          <>
                            {(!activeRequest || activeRequest.status === 'approved') && (
                              <Button 
                                onClick={handleRequestAccess}
                                disabled={isSubmitting}
                                className="bg-orange hover:bg-orange/90 text-white font-black uppercase text-[10px] h-12 px-10 shadow-lg shadow-orange/20 border-none w-full"
                              >
                                <Send className="w-4 h-4 mr-3" /> Initiate Protocol Update
                              </Button>
                            )}
                            {activeRequest?.status === 'granted' && (
                               <Button 
                                onClick={() => setIsEditing(true)}
                                className="bg-active hover:bg-active/90 text-white font-black uppercase text-[10px] h-12 px-10 shadow-lg shadow-active/20 border-none w-full"
                              >
                                 <Edit3 className="w-4 h-4 mr-3" /> Authorize Modifications
                               </Button>
                            )}
                          </>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 w-full">
                             <Button 
                                onClick={() => setIsEditing(false)}
                                variant="outline"
                                className={cn("h-12 font-black uppercase text-[10px]", isMobilityUser ? "border-slate-200" : "border-white/10")}
                             >
                                Abort
                             </Button>
                             <Button 
                                onClick={handleSubmitChanges}
                                disabled={isSubmitting}
                                className="bg-active hover:bg-active/90 text-white font-black uppercase text-[10px] h-12 shadow-lg shadow-active/20 border-none"
                             >
                                Commit for Review
                             </Button>
                          </div>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            {role === 'driver' && (
              <TabsContent value="documents" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['license', 'rc', 'manifest'].map((docKey) => {
                    const docData = profile?.docs?.[docKey]
                    const status = docData?.status || 'missing'
                    const labels: any = { license: 'Driving License', rc: 'Vehicle RC', manifest: 'Asset Manifest' }
                    
                    return (
                      <Card key={docKey} className="bg-white border-none shadow-xl overflow-hidden group">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                              <FileText className="w-4 h-4 text-orange" /> {labels[docKey]}
                            </CardTitle>
                            <Badge className={cn(
                              "text-[8px] font-black uppercase",
                              status === 'approved' ? "bg-active/10 text-active" :
                              status === 'pending' ? "bg-orange/10 text-orange" :
                              status === 'resubmit' ? "bg-emergency/10 text-emergency" : "bg-slate-200 text-slate-600"
                            )}>
                              {status === 'resubmit' ? 'RE-SUBMISSION REQUIRED' : status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {docData?.url ? (
                            <div className="space-y-4">
                               <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative group">
                                  <img src={docData.url} alt={labels[docKey]} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                     <Button size="sm" variant="outline" className="text-white border-white/20 hover:bg-white/10 font-black uppercase text-[8px]" asChild>
                                        <a href={docData.url} target="_blank"><Eye className="w-3 h-3 mr-1" /> View</a>
                                     </Button>
                                     {(status === 'resubmit' || status === 'rejected' || status === 'missing') && (
                                       <div className="relative">
                                          <input 
                                            type="file" 
                                            className={cn('absolute inset-0 opacity-0', activeRequest?.status === 'granted' ? 'cursor-pointer' : 'cursor-not-allowed')} 
                                            onChange={(e) => handleFileUpload(e, docKey)} 
                                          />
                                          <Button size="sm" className="bg-orange text-white font-black uppercase text-[8px]">
                                             <RefreshCw className="w-3 h-3 mr-1" /> Re-upload
                                          </Button>
                                       </div>
                                     )}
                                  </div>
                               </div>
                               {docData.adminNote && (
                                 <div className="p-3 bg-emergency/5 border border-emergency/10 rounded-lg">
                                    <p className="text-[8px] font-black text-emergency uppercase tracking-widest mb-1">Command Note</p>
                                    <p className="text-[10px] font-medium text-slate-600 italic">"{docData.adminNote}"</p>
                                 </div>
                               )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                               <Upload className="w-10 h-10 text-slate-300 mb-4" />
                               <p className="text-[10px] font-black uppercase text-slate-500 mb-6">File Not Logged</p>
                               <div className="relative">
                                  <input 
                                    type="file" 
                                    className={cn('absolute inset-0 opacity-0', activeRequest?.status === 'granted' ? 'cursor-pointer' : 'cursor-not-allowed')} 
                                    onChange={(e) => handleFileUpload(e, docKey)} 
                                  />
                                  <Button className={cn('font-black uppercase text-[10px] px-8 h-10 shadow-lg border-none', activeRequest?.status === 'granted' ? 'bg-orange hover:bg-orange/90 text-white shadow-orange/20' : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed')}>
                                    {activeRequest?.status === 'granted' ? 'Upload Credentials' : 'Access Restricted'}
                                  </Button>
                               </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            )}

            <TabsContent value="audit" className="space-y-6">
              <Card className={cn("border-none shadow-2xl p-8", isMobilityUser ? "bg-white" : "glass-panel")}>
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="text-sm font-black uppercase flex items-center gap-3">
                     <Layout className="w-5 h-5 text-orange" />
                     Terminal Access Log
                   </h4>
                   <ChevronRight className="w-4 h-4 text-slate-300" />
                 </div>
                 <div className="space-y-4">
                    {[
                      { action: "Session Initiated", time: "2m ago", desc: "Global Prime Sector" },
                      { action: "Identity Pulse", time: "1h ago", desc: "Automated Verification" }
                    ].map((log, i) => (
                      <div key={i} className={cn("p-4 rounded-xl flex justify-between items-center", isMobilityUser ? "bg-slate-50" : "bg-white/5")}>
                         <div>
                           <p className="text-[10px] font-black uppercase">{log.action}</p>
                           <p className={cn("text-[9px] font-bold uppercase mt-0.5", isMobilityUser ? "text-slate-500" : "text-white/40")}>{log.desc}</p>
                         </div>
                         <span className={cn("text-[9px] font-mono", isMobilityUser ? "text-slate-400" : "text-white/40")}>{log.time}</span>
                      </div>
                    ))}
                 </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
