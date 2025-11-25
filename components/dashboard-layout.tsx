"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Leaf, LayoutDashboard, History, MessageSquare, Globe, User, Settings, LogOut, Menu, X, Calendar, Users, Building2, Beaker, Newspaper, Trophy, Camera, MapPin, CloudRain, TrendingUp, Home } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface DashboardLayoutProps {
	children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	// State for the authenticated user
	const [user, setUser] = useState<any>(null)
	const pathname = usePathname()
	const router = useRouter()
	const { t } = useLanguage()

	const sidebarItems = [
		{ titleKey: "home", href: "/dashboard", icon: Home },
		{ titleKey: "cropDiseaseDetection", href: "/dashboard/disease-detection", icon: Camera },
		{ titleKey: "cropAdvisory", href: "/dashboard/crop-advisory", icon: MapPin },
		{ titleKey: "smartCropCalendar", href: "/dashboard/crop-calendar", icon: Calendar },
		{ titleKey: "communityForum", href: "/dashboard/community", icon: Users },
		{ titleKey: "governmentSchemes", href: "/dashboard/schemes", icon: Building2 },
		{ titleKey: "soilReports", href: "/dashboard/soil-report", icon: Beaker },
		{ titleKey: "weatherAlerts", href: "/dashboard/weather-alerts", icon: CloudRain },
		{ titleKey: "marketPrices", href: "/dashboard/market-prices", icon: TrendingUp },
		{ titleKey: "agriNews", href: "/dashboard/news", icon: Newspaper },
		{ titleKey: "achievements", href: "/dashboard/achievements", icon: Trophy },
		{ titleKey: "talkWithFarmii", href: "/dashboard/chat", icon: MessageSquare },
		{ titleKey: "history", href: "/dashboard/history", icon: History },
		{ titleKey: "changeLanguage", href: "/dashboard/language", icon: Globe },
	]

	// ✅ UPDATED: Fetch logged-in user info, prioritizing localStorage for quick render
	useEffect(() => {
		// 1. Try to load user from localStorage immediately (like page.tsx)
		const storedUser = localStorage.getItem("user")
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser)
			setUser(parsedUser)
		}

		// 2. Then, try to fetch the latest user data from API (if a token exists)
		const fetchUser = async () => {
			try {
				const token = localStorage.getItem("token")
				if (!token) {
					// If no token, and no stored user, ensure user is null
					if (!storedUser) {
						setUser(null)
					}
					return
				}
				
				const res = await fetch("/api/user", {
					headers: { Authorization: `Bearer ${token}` },
				})
				
				if (!res.ok) {
					throw new Error("Failed to fetch user")
				}
				
				const data = await res.json()
				setUser(data)
				// Optional: Update localStorage with the latest API data
				localStorage.setItem("user", JSON.stringify(data)); 
			} catch (err) {
				console.error("Error fetching user:", err)
				// Handle case where API fetch fails, but a stored user exists
				if (!storedUser) {
					// If no user could be fetched or found in storage, you might want to redirect to login
					// router.push("/login") 
				}
			}
		}
		
		fetchUser()
	}, [router]) // Added router to dependencies for Next.js

	const handleLogout = () => {
		localStorage.removeItem("token")
		// Also remove stored user info
		localStorage.removeItem("user")
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
								{user?.profilePhoto ? (
									<AvatarImage src={user.profilePhoto} />
								) : (
									<AvatarFallback className="bg-primary text-primary-foreground">
										{/* Display initials or 'RF' for default/loading */}
										{user?.fullName
											? user.fullName
													.split(" ")
													.map((n: string) => n[0])
													.join("")
											: "RF"}
									</AvatarFallback>
								)}
							</Avatar>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-sidebar-foreground truncate">
									{user?.fullName || t("loadingFarmer")}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{user?.farmLocation || t("loadingLocation")}
								</p>
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
											<span>{t(item.titleKey)}</span>
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
								<span>{t("profile")}</span>
							</Link>
							<Link
								href="/dashboard/settings"
								className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
								onClick={() => setSidebarOpen(false)}
							>
								<Settings className="h-4 w-4" />
								<span>{t("settings")}</span>
							</Link>
							<button
								onClick={handleLogout}
								className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
							>
								<LogOut className="h-4 w-4" />
								<span>{t("logout")}</span>
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
								{t("lastUpdated")}: {new Date().toLocaleDateString()}
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