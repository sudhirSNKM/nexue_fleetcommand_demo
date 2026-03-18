
"use client"

import * as React from "react"
import { 
  Settings, 
  LogOut,
  Bell,
  Navigation,
  ShieldCheck,
  Zap,
  Menu,
  History,
  Map as MapIcon,
  BarChart3,
  Users,
  Globe,
  DollarSign,
  Activity,
  Layers,
  Car,
  Timer,
  AlertTriangle,
  User,
  LayoutDashboard,
  ShieldAlert,
  Clock,
  MessageSquare
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useDoc, useMemoFirebase, useAuth, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card } from "@/components/ui/card"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "userProfiles", user.uid)
  }, [user, db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  // Redirect to login if no user
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const role = (profile?.role || "passenger").toLowerCase().trim().replace(/[\s_-]+/g, '-')
  const status = (profile?.status || "Active").toLowerCase()
  const isMobilityUser = role === "passenger" || role === "driver"
  const isPendingDriver = role === "driver" && status === "pending"
  const isAdmin = role === "admin" || role === "super-admin"

  const navItems = React.useMemo(() => {
    if (isPendingDriver) return [{ icon: Settings, label: "Onboarding", href: "/onboarding/vehicle-details" }]
    
    const items = []
    
    if (role === "super-admin") {
      items.push(
        { icon: Globe, label: "Command Center", href: "/dashboard/super-admin" },
        { icon: MessageSquare, label: "Tactical Chat", href: "/dashboard/chat" },
        { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
        { icon: Users, label: "Personnel", href: "/dashboard/drivers" },
        { icon: Car, label: "Fleet Registry", href: "/dashboard/fleet" },
        { icon: Navigation, label: "Mission Log", href: "/dashboard/trips" },
        { icon: ShieldAlert, label: "Auth Requests", href: "/dashboard/admin/profile-requests" },
        { icon: ShieldCheck, label: "Admin Ops", href: "/dashboard/admin-management" },
        { icon: Activity, label: "Audit Pulse", href: "/dashboard/audit-logs" },
        { icon: Settings, label: "System Node", href: "/dashboard/settings" }
      )
    } else if (role === "admin") {
      items.push(
        { icon: LayoutDashboard, label: "Operations", href: "/dashboard/admin" },
        { icon: MessageSquare, label: "Tactical Chat", href: "/dashboard/chat" },
        { icon: ShieldAlert, label: "Auth Requests", href: "/dashboard/admin/profile-requests" },
        { icon: Users, label: "Operators", href: "/dashboard/drivers" },
        { icon: Timer, label: "Duty Manifest", href: "/dashboard/duty" },
        { icon: History, label: "Missions", href: "/dashboard/history" },
        { icon: User, label: "Passengers", href: "/dashboard/passengers-list" },
        { icon: AlertTriangle, label: "Active Alerts", href: "/dashboard/alerts" },
        { icon: Settings, label: "Node Config", href: "/dashboard/settings" }
      )
    } else if (role === "driver") {
      items.push(
        { icon: Navigation, label: "Duty Hub", href: "/dashboard/driver" },
        { icon: DollarSign, label: "Credits", href: "/dashboard/driver/earnings" },
        { icon: History, label: "Archives", href: "/dashboard/history" }
      )
    } else {
      items.push(
        { icon: Zap, label: "Deploy Unit", href: "/dashboard/passenger" },
        { icon: History, label: "Past Trips", href: "/dashboard/history" }
      )
    }

    items.push({ icon: User, label: "Identity", href: "/dashboard/profile" })
    return items
  }, [role, isPendingDriver])

  if (isUserLoading || isProfileLoading || !user) return (
    <div className="h-screen w-full flex items-center justify-center bg-charcoal">
      <div className="w-8 h-8 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
    </div>
  )

  const SidebarContent = () => (
    <div className={cn("h-full flex flex-col", isMobilityUser ? "bg-white border-r" : "bg-card/30 backdrop-blur-xl")}>
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-orange rounded flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className={cn("font-black text-xl tracking-tighter", isMobilityUser ? "text-slate-900" : "text-white")}>
            Fleet<span className="text-orange">OS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 5 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive 
                    ? "bg-orange/10 text-orange shadow-inner" 
                    : isMobilityUser ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-orange" : "group-hover:text-orange")} />
                <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className={cn("p-4 border-t mt-auto", isMobilityUser ? "border-slate-100" : "border-white/5")}>
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className={cn("w-full justify-start font-black uppercase text-[10px] h-12 rounded-xl", isMobilityUser ? "text-slate-500 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground hover:text-emergency hover:bg-emergency/10")}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Abort Session
        </Button>
      </div>
    </div>
  )

  return (
    <div className={cn("flex h-screen overflow-hidden transition-colors duration-500", isMobilityUser ? "bg-slate-50" : "bg-charcoal")}>
      <aside className="hidden lg:flex w-64 flex-col shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={cn("h-16 border-b z-20 flex items-center justify-between px-4 lg:px-8 transition-colors duration-500", isMobilityUser ? "bg-white border-slate-100 shadow-sm" : "bg-card/20 backdrop-blur-md border-white/5")}>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("lg:hidden", isMobilityUser ? "text-slate-900" : "text-white")}>
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={cn("p-0 w-72 border-r", isMobilityUser ? "bg-white" : "bg-charcoal border-white/5")}>
                <SheetTitle className="sr-only">FleetOS Terminal Navigation</SheetTitle>
                <SheetDescription className="sr-only">Access tactical hubs and account registry</SheetDescription>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className={cn("flex h-2 w-2 rounded-full animate-pulse", isPendingDriver ? "bg-orange" : "bg-active shadow-[0_0_8px_currentColor]")} />
              <span className={cn("text-[10px] font-black uppercase tracking-widest hidden sm:inline", isMobilityUser ? "text-slate-500" : isPendingDriver ? "text-orange" : "text-active")}>
                {isPendingDriver ? "Awaiting Activation" : "Node Secure"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className={cn("relative transition-all hover:scale-110", isMobilityUser ? "text-slate-400 hover:text-slate-900" : "text-muted-foreground hover:text-white")}>
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emergency rounded-full shadow-[0_0_5px_#FF0000]" />
            </button>

            <div className={cn("flex items-center gap-3 border-l pl-4 lg:pl-6", isMobilityUser ? "border-slate-100" : "border-white/5")}>
              <div className="text-right hidden sm:block">
                <p className={cn("text-xs font-black uppercase tracking-tighter", isMobilityUser ? "text-slate-900" : "text-white")}>{profile?.name || "Member"}</p>
                <p className="text-[9px] text-orange uppercase font-bold tracking-widest">{role}</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-orange/20 shadow-lg">
                <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                <AvatarFallback className="font-black">U</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4 lg:p-8 relative scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}
