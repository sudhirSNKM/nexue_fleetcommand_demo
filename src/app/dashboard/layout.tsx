
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map as MapIcon, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ShieldAlert
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { icon: LayoutDashboard, label: "Command Center", href: "/dashboard" },
  { icon: MapIcon, label: "Live Tracking", href: "/dashboard/map" },
  { icon: Truck, label: "Fleet Status", href: "/dashboard/fleet" },
  { icon: Users, label: "Drivers", href: "/dashboard/drivers" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: ShieldAlert, label: "Safety & Alerts", href: "/dashboard/alerts" },
  { icon: Settings, label: "System Config", href: "/dashboard/settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  return (
    <div className="flex h-screen overflow-hidden bg-charcoal">
      {/* Sidebar */}
      <aside className="w-64 border-r border-navy/20 bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-orange rounded flex items-center justify-center shadow-[0_0_15px_rgba(255,128,0,0.5)]">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-orange transition-all">
              NEXUS
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
                      ? "bg-navy/40 text-orange border-l-2 border-orange" 
                      : "text-muted-foreground hover:bg-navy/20 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-orange" : "group-hover:text-orange transition-colors")} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="ml-auto w-1 h-1 rounded-full bg-orange shadow-[0_0_8px_rgba(255,128,0,0.8)]" 
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-navy/20">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="command-grid-overlay" />
        
        {/* Topbar */}
        <header className="h-16 border-b border-navy/20 bg-card/20 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                placeholder="Search fleet, drivers, routes..." 
                className="bg-navy/20 border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-full focus:ring-1 focus:ring-orange/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-active animate-pulse" />
              <span className="text-xs font-medium text-active uppercase tracking-widest">Global Status: Nominal</span>
            </div>
            
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emergency rounded-full" />
            </button>

            <div className="flex items-center gap-3 border-l border-navy/20 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold">Director One</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Super Admin</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-orange/20">
                <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dynamic Dashboard View */}
        <section className="flex-1 overflow-auto p-8 relative scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}
