
"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Truck, Car, ShieldCheck, FileText, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useDoc, useMemoFirebase, useStorage } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function VehicleOnboardingPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [vehicleModel, setVehicleModel] = useState("")
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [licenseNumber, setVehicleLicense] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "userProfiles", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef)
  const storage = useStorage()

  const [uploads, setUploads] = useState<Record<string, { url: string, fileName: string }>>({})
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file || !user || !storage) return

    setIsUploading(prev => ({ ...prev, [docType]: true }))
    try {
      const fileRef = ref(storage, `documents/${user.uid}/${docType}`)
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)
      
      setUploads(prev => ({ 
        ...prev, 
        [docType]: { url: downloadURL, fileName: file.name } 
      }))
      
      toast({
        title: "Credential Logged",
        description: `${docType.toUpperCase()} successfully uploaded to encrypted storage.`
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Link Failed",
        description: error.message
      })
    } finally {
      setIsUploading(prev => ({ ...prev, [docType]: false }))
    }
  }

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login")
    if (!isProfileLoading && profile && profile.role !== "driver") router.push("/dashboard")
    if (!isProfileLoading && profile && profile.status === "Active") router.push("/dashboard")
  }, [user, isUserLoading, profile, isProfileLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileRef) return
    setIsLoading(true)
    
    try {
      const docs: any = {}
      if (uploads.license) {
        docs.license = { ...uploads.license, status: 'pending', uploadedAt: serverTimestamp() }
      }
      if (uploads.rc) {
        docs.rc = { ...uploads.rc, status: 'pending', uploadedAt: serverTimestamp() }
      }

      await updateDoc(profileRef, {
        vehicleModel,
        vehicleNumber,
        licenseNumber,
        docs,
        detailsSubmitted: true,
        onboardingAt: serverTimestamp(),
        status: "pending"
      })

      toast({
        title: "Tactical Manifest Submitted",
        description: "Data sent to Admin Command. Verification in progress.",
      })
      
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transmission Error",
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-charcoal">
        <div className="w-8 h-8 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-charcoal p-4 overflow-hidden relative">
      <div className="command-grid-overlay opacity-40" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange mb-4 shadow-2xl">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Asset Manifest</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">Operator Vehicle Registration</p>
        </div>

        <Card className="glass-panel border-navy/30">
          <CardHeader>
            <CardTitle className="text-lg font-bold uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange" /> Unit Specifications
            </CardTitle>
            <CardDescription className="text-xs text-white/40 uppercase">Provide your primary deployment vehicle details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-white/40 ml-1">Vehicle Model</Label>
                  <Input 
                    placeholder="e.g. Bajaj Pulsar / Activa" 
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                    className="bg-navy/20 border-navy/50 h-11 text-sm font-medium focus:ring-orange/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-white/40 ml-1">Plate Number</Label>
                  <Input 
                    placeholder="KA-01-NX-XXXX" 
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                    className="bg-navy/20 border-navy/50 h-11 text-sm font-mono focus:ring-orange/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-white/40 ml-1">Operator License Number</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input 
                    placeholder="DL-XXXXXXXXXXXXX" 
                    value={licenseNumber}
                    onChange={(e) => setVehicleLicense(e.target.value)}
                    required
                    className="pl-10 bg-navy/20 border-navy/50 h-11 text-sm font-mono focus:ring-orange/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-black text-white/40 ml-1">License Scan</Label>
                    <div className={cn(
                      "p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                      uploads.license ? "bg-active/10 border-active/50" : "bg-navy/20 border-navy/50 hover:bg-navy/30"
                    )}>
                       {isUploading.license ? (
                         <div className="w-6 h-6 border-2 border-orange/40 border-t-orange rounded-full animate-spin" />
                       ) : uploads.license ? (
                         <ShieldCheck className="w-8 h-8 text-active" />
                       ) : (
                         <FileText className="w-8 h-8 text-white/10" />
                       )}
                       <p className="text-[9px] font-black uppercase text-white/20 mt-2">{uploads.license ? "Credential Logged" : "Select License File"}</p>
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer"
                         onChange={(e) => handleFileUpload(e, 'license')}
                         disabled={isUploading.license}
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-black text-white/40 ml-1">Vehicle RC Scan</Label>
                    <div className={cn(
                      "p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                      uploads.rc ? "bg-active/10 border-active/50" : "bg-navy/20 border-navy/50 hover:bg-navy/30"
                    )}>
                       {isUploading.rc ? (
                         <div className="w-6 h-6 border-2 border-orange/40 border-t-orange rounded-full animate-spin" />
                       ) : uploads.rc ? (
                         <ShieldCheck className="w-8 h-8 text-active" />
                       ) : (
                         <Truck className="w-8 h-8 text-white/10" />
                       )}
                       <p className="text-[9px] font-black uppercase text-white/20 mt-2">{uploads.rc ? "Credential Logged" : "Select RC File"}</p>
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer"
                         onChange={(e) => handleFileUpload(e, 'rc')}
                         disabled={isUploading.rc}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-4 rounded-xl bg-orange/5 border border-orange/20">
                <p className="text-[10px] font-bold text-orange uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Final Step
                </p>
                <p className="text-[9px] text-white/40 mt-1 leading-relaxed uppercase">
                  By submitting, you agree to manual background check. Operational access will be granted within 24-48 cycles.
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || isUploading.license || isUploading.rc}
                className="w-full h-12 bg-orange hover:bg-orange/90 text-white font-black uppercase tracking-widest text-xs shadow-lg"
              >
                {isLoading ? "Transmitting..." : "Submit for Verification"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
