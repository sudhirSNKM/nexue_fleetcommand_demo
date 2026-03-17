
"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function Dashboard() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  useEffect(() => {
    if (!isProfileLoading && profile) {
      const role = (profile.role || "passenger").toLowerCase().replace(/\s+/g, '-')
      const status = (profile.status || "Pending").toLowerCase()

      if (role === "driver" && status === "pending") {
        if (!profile.detailsSubmitted) {
          router.push("/onboarding/vehicle-details")
        }
        return
      }
      
      if (role === "super-admin") {
        router.push("/dashboard/super-admin")
      } else if (role === "admin") {
        router.push("/dashboard/admin")
      } else if (role === "driver") {
        router.push("/dashboard/driver")
      } else if (role === "passenger") {
        router.push("/dashboard/passenger")
      } else {
        router.push("/dashboard/passenger")
      }
    }
  }, [profile, isProfileLoading, router])

  return (
    <div className="h-full w-full flex items-center justify-center bg-charcoal">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
        <p className="text-[10px] text-white uppercase font-black tracking-[0.3em] animate-pulse">
          Initializing Secure Session...
        </p>
      </div>
    </div>
  )
}
