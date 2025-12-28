"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Leaf,
  History,
  MessageSquare,
  Globe,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  Users,
  Building2,
  Beaker,
  Newspaper,
  Trophy,
  Camera,
  MapPin,
  CloudRain,
  TrendingUp,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

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
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // CHANGED: bg-emerald-950 for deep green, border-emerald-900 for subtle border
          "fixed inset-y-0 left-0 z-50 w-64 bg-emerald-950 border-r border-emerald-900 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-900/50">
          <div className="flex items-center space-x-2">
            {/* White icon and text for contrast */}
            <Leaf className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold text-white tracking-wide">Farm AI</span>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden text-white hover:bg-emerald-900" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-emerald-900/50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border border-emerald-700">
              {user?.profilePhoto ? (
                <AvatarImage src={user.profilePhoto} />
              ) : (
                <AvatarFallback className="bg-emerald-800 text-emerald-100">
                  {user?.fullName
                    ? user.fullName.split(" ").map((n: string) => n[0]).join("")
                    : "FR"}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName || t("loadingFarmer")}
              </p>
              <p className="text-xs text-emerald-400/80 truncate">
                {user?.farmLocation || t("loadingLocation")}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-emerald-900 text-white shadow-md border border-emerald-800" // Active State
                        : "text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white" // Inactive State
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <IconComponent 
                        className={cn(
                            "h-4 w-4 transition-colors", 
                            isActive ? "text-emerald-400" : "text-emerald-400/60 group-hover:text-emerald-400"
                        )} 
                    />
                    <span>{t(item.titleKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-emerald-900/50 bg-emerald-950">
          <div className="grid gap-1">
            <Link
              href="/dashboard/profile"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white transition-colors"
            >
              <User className="h-4 w-4" />
              <span>{t("profile")}</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>{t("settings")}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-950/30 hover:text-red-200 transition-colors mt-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        
        {/* Top bar - ONLY Visible on Mobile/Tablet */}
        <header className="bg-white border-b border-border px-4 py-3 lg:hidden flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
             </Button>
             <span className="font-semibold text-lg">Farm AI</span>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}