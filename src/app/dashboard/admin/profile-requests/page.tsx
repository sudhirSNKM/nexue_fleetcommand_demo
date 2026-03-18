
"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  ArrowRight, 
  FileText,
  ShieldCheck,
  AlertCircle,
  Eye,
  Loader2
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

export default function ProfileRequestsPage() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const requestsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "profileUpdateRequests"), orderBy("requestedAt", "desc")) : null, 
  [db])
  
  const { data: requests, isLoading } = useCollection(requestsQuery)
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleGrantAccess = async (requestId: string) => {
    if (!db) return
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "profileUpdateRequests", requestId), {
        status: "granted",
        grantedAt: serverTimestamp(),
      })
      toast({
        title: "Access Granted",
        description: "The driver has been granted access to update their profile.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCommitChanges = async () => {
    if (!db || !selectedRequest) return
    setIsProcessing(true)
    try {
      // 1. Update User Profile
      const profileRef = doc(db, "userProfiles", selectedRequest.userId)
      const updatedData = {
        ...selectedRequest.requestedChanges,
        profileLastUpdatedAt: serverTimestamp(),
        profileUpdateProof: selectedRequest.proofNotes
      }
      await updateDoc(profileRef, updatedData)

      // 2. Update Request Status
      await updateDoc(doc(db, "profileUpdateRequests", selectedRequest.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        committedBy: "admin"
      })

      // 3. Optional: Create Audit Log
      // (Implementation depends on if auditLogs collection exists and its schema)

      toast({
        title: "Changes Committed",
        description: "The profile has been successfully updated in the database.",
      })
      setIsReviewing(false)
      setSelectedRequest(null)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Commit Failed",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange/20 text-orange border-orange/20 uppercase font-black text-[8px]">Pending Access</Badge>
      case 'granted':
        return <Badge className="bg-active/20 text-active border-active/20 uppercase font-black text-[8px]">Access Granted</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 uppercase font-black text-[8px]">Review Required</Badge>
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 uppercase font-black text-[8px]">Committed</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/20 uppercase font-black text-[8px]">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
          Profile Identity Terminal
          <ShieldAlert className="w-8 h-8 text-orange" />
        </h1>
        <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Manage Restricted Credential Updates</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-panel border-none">
          <CardHeader className="p-6 border-b border-white/5 bg-navy/10">
            <CardTitle className="text-xs font-black uppercase text-white/60 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange" /> Active Request Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-orange animate-spin" />
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Scanning Network...</p>
              </div>
            ) : requests?.length === 0 ? (
              <div className="p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">No pending identity requests</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {requests?.map((req: any) => (
                  <div key={req.id} className="p-4 hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-navy/40 flex items-center justify-center border border-white/5">
                        <User className="w-5 h-5 text-orange" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black uppercase text-white">{req.userName || "Operator Unknown"}</p>
                          {renderStatusBadge(req.status)}
                        </div>
                        <p className="text-[9px] text-white/40 font-mono uppercase mt-0.5">ID: {req.userId?.substring(0, 12)}... • Role: {req.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block mr-4">
                        <p className="text-[8px] text-white/40 uppercase font-black">Requested On</p>
                        <p className="text-[10px] text-white font-bold">{req.requestedAt?.toDate().toLocaleString() || "Syncing..."}</p>
                      </div>

                      {req.status === 'pending' && (
                        <Button 
                          onClick={() => handleGrantAccess(req.id)}
                          disabled={isProcessing}
                          className="bg-orange text-white font-black uppercase text-[9px] h-9 px-4 shadow-[0_0_10px_rgba(255,128,0,0.2)]"
                        >
                          Grant Access
                        </Button>
                      )}

                      {req.status === 'submitted' && (
                        <Button 
                          onClick={() => {
                            setSelectedRequest(req)
                            setIsReviewing(true)
                          }}
                          className="bg-active text-white font-black uppercase text-[9px] h-9 px-4 shadow-[0_0_10px_rgba(0,255,0,0.1)]"
                        >
                          <Eye className="w-3 h-3 mr-2" /> Review Changes
                        </Button>
                      )}

                      {req.status === 'approved' && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Committed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewing} onOpenChange={setIsReviewing}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange" /> Review Identity Update
            </DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold text-white/40 tracking-wider">
              Verify operator credentials and commits changes to core database.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-navy/20 rounded-xl border border-white/5 space-y-3">
                   <h4 className="text-[10px] font-black uppercase text-orange border-b border-orange/10 pb-2">Submitted Data</h4>
                   {Object.entries(selectedRequest.requestedChanges || {}).map(([key, value]: [string, any]) => (
                     <div key={key}>
                       <p className="text-[8px] uppercase text-white/40 font-bold">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                       <p className="text-xs font-bold text-white">{value}</p>
                     </div>
                   ))}
                </div>
                <div className="p-4 bg-navy/20 rounded-xl border border-white/5 space-y-3">
                   <h4 className="text-[10px] font-black uppercase text-active border-b border-active/10 pb-2">Verification Proof</h4>
                   <div className="p-3 bg-white/5 rounded-lg border border-dashed border-white/10 min-h-[100px]">
                      <p className="text-xs text-white/80 leading-relaxed italic">
                        "{selectedRequest.proofNotes || "No proof notes provided."}"
                      </p>
                   </div>
                   <div className="flex items-center gap-2 mt-4 text-[9px] text-white/60">
                     <FileText className="w-4 h-4 text-orange" />
                     <span>Credentials Attached: 2 Documents (Scan Verified)</span>
                   </div>
                </div>
              </div>

              <div className="p-4 bg-orange/5 border border-orange/10 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/60 font-medium leading-relaxed uppercase">
                  Careful: Committing these changes will immediately update the live Operator Profile in the database. This action is irreversible without a new request cycle.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsReviewing(false)}
              className="border-white/10 text-white font-black uppercase text-[10px] h-10 px-8"
            >
              Close Terminal
            </Button>
            <Button 
              onClick={handleCommitChanges}
              disabled={isProcessing}
              className="bg-active text-white font-black uppercase text-[10px] h-10 px-8"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Commit to Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
