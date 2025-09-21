"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Leaf, LayoutDashboard, History, MessageSquare, Globe, User, Settings, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const sidebarItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "History",
      href: "/dashboard/history",
      icon: History,
    },
    {
      title: "Talk with Farmii",
      href: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      title: "Change Language",
      href: "/dashboard/language",
      icon: Globe,
    },
  ]

  const handleLogout = () => {
    // Simulate logout
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-sidebar-foreground">Farm AI</span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/indian-farmer-profile.jpg" />
                <AvatarFallback className="bg-primary text-primary-foreground">RF</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Rajesh Farmer</p>
                <p className="text-xs text-muted-foreground truncate">Pune, Maharashtra</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="space-y-2">
              <Link
                href="/dashboard/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-background border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4 ml-auto">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
