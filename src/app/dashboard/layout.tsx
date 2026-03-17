
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Navigation,
  ShieldCheck,
  User,
  Zap,
  Menu
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const role = profile?.role || "Passenger"

  const navItems = React.useMemo(() => {
    const items = []

    if (role === "Passenger") {
      items.push(
        { icon: Zap, label: "Book Ride", href: "/dashboard/passenger" },
        { icon: LayoutDashboard, label: "Ride History", href: "/dashboard/history" }
      )
    }

    if (role === "Driver") {
      items.push(
        { icon: Navigation, label: "Duty Console", href: "/dashboard/driver" },
        { icon: ShieldCheck, label: "Safety Score", href: "/dashboard/safety" }
      )
    }

    if (role === "Admin" || role === "Super Admin") {
      items.push(
        { icon: MapIcon, label: "Global Tracker", href: "/dashboard/admin" },
        { icon: BarChart3, label: "Revenue Matrix", href: "/dashboard/analytics" }
      )
    }

    items.push({ icon: Settings, label: "Account", href: "/dashboard/settings" })
    return items
  }, [role])

  if (isUserLoading || isProfileLoading || !user) return (
    <div className="h-screen w-full flex items-center justify-center bg-charcoal">
      <div className="w-8 h-8 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
    </div>
  )

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-xl">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-orange rounded flex items-center justify-center shadow-[0_0_15px_rgba(255,128,0,0.5)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter text-white group-hover:text-orange transition-all">
            RAPIDO <span className="text-orange">OS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 5 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group",
                  isActive 
                    ? "bg-orange/10 text-orange border-l-2 border-orange" 
                    : "text-muted-foreground hover:bg-navy/20 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-orange" : "group-hover:text-orange transition-colors")} />
                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-navy/20">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-emergency hover:bg-emergency/10"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Abort Session
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-charcoal">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-navy/20 flex-col shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-navy/20 bg-card/20 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r border-navy/20 bg-charcoal">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-active animate-pulse" />
              <span className="text-[10px] font-black text-active uppercase tracking-widest hidden sm:inline">Network Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative text-muted-foreground hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emergency rounded-full" />
            </button>

            <div className="flex items-center gap-3 border-l border-navy/20 pl-4 lg:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase tracking-tighter">{profile?.name || "Capturing..."}</p>
                <p className="text-[9px] text-orange uppercase font-bold tracking-widest">{role}</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-orange/20">
                <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4 lg:p-8 relative scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
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
