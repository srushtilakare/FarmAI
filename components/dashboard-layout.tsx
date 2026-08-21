"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
  Bell,
  Heart,
  MessageCircle,
  Award,
  Flame,
  AlertTriangle,
  Sprout,
  CheckCircle,
  ShieldAlert,
  ExternalLink,
  Check,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    fullName?: string;
    profilePhoto?: string;
  } | null;
  senderName?: string;
  category: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  relatedId?: string | null;
  relatedType?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

const API_BASE_URL = "http://localhost:5000";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const sidebarItems = [
    { titleKey: "home", href: "/dashboard", icon: Home },
    {
      titleKey: "cropDiseaseDetection",
      href: "/dashboard/disease-detection",
      icon: Camera,
    },
    {
      titleKey: "cropAdvisory",
      href: "/dashboard/crop-advisory",
      icon: MapPin,
    },
    {
      titleKey: "smartCropCalendar",
      href: "/dashboard/crop-calendar",
      icon: Calendar,
    },
    {
      titleKey: "communityForum",
      href: "/dashboard/community",
      icon: Users,
    },
    {
      titleKey: "governmentSchemes",
      href: "/dashboard/schemes",
      icon: Building2,
    },
    {
      titleKey: "soilReports",
      href: "/dashboard/soil-report",
      icon: Beaker,
    },
    {
      titleKey: "weatherAlerts",
      href: "/dashboard/weather-alerts",
      icon: CloudRain,
    },
    {
      titleKey: "marketPrices",
      href: "/dashboard/market-prices",
      icon: TrendingUp,
    },
    {
      titleKey: "agriNews",
      href: "/dashboard/news",
      icon: Newspaper,
    },
    {
      titleKey: "achievements",
      href: "/dashboard/achievements",
      icon: Trophy,
    },
    {
      titleKey: "talkWithFarmii",
      href: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      titleKey: "history",
      href: "/dashboard/history",
      icon: History,
    },
    {
      titleKey: "changeLanguage",
      href: "/dashboard/language",
      icon: Globe,
    },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
  }, []);

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      setNotificationLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/notifications?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch notifications:",
          response.status
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // =========================================================
  // FETCH UNREAD COUNT
  // =========================================================

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  // =========================================================
  // INITIAL NOTIFICATION LOAD
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    fetchUnreadCount();

    // Refresh unread count periodically so the bell stays current.
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // =========================================================
  // OPEN/CLOSE NOTIFICATION PANEL
  // =========================================================

  const toggleNotifications = async () => {
    const nextState = !notificationOpen;

    setNotificationOpen(nextState);

    if (nextState) {
      await fetchNotifications();
    }
  };

  // =========================================================
  // MARK NOTIFICATION AS READ
  // =========================================================

  const markNotificationAsRead = async (
    notificationId: string
  ) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    }
  };

  // =========================================================
  // MARK ALL NOTIFICATIONS AS READ
  // =========================================================

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem("token");

    if (!token || unreadCount === 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error
      );
    }
  };

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (notification: NotificationItem) => {
    const iconClass = "h-4 w-4";

    switch (notification.type) {
      case "POST_LIKED":
      case "REPLY_LIKED":
        return <Heart className={`${iconClass} text-red-500`} />;

      case "POST_REPLIED":
      case "DISCUSSION_REPLY":
        return (
          <MessageCircle
            className={`${iconClass} text-blue-500`}
          />
        );

      case "BADGE_EARNED":
      case "ACHIEVEMENT_COMPLETED":
        return (
          <Award className={`${iconClass} text-yellow-500`} />
        );

      case "STREAK_MILESTONE":
      case "STREAK_AT_RISK":
        return (
          <Flame className={`${iconClass} text-orange-500`} />
        );

      case "LEVEL_UP":
      case "POINTS_EARNED":
        return (
          <Trophy className={`${iconClass} text-purple-500`} />
        );

      case "WEATHER_ALERT":
        return (
          <CloudRain
            className={`${iconClass} text-blue-500`}
          />
        );

      case "CROP_TASK_DUE":
      case "CROP_TASK_REMINDER":
        return (
          <Sprout className={`${iconClass} text-green-500`} />
        );

      case "FORUM_WARNING":
      case "FORUM_SUSPENDED":
      case "FORUM_BANNED":
        return (
          <ShieldAlert
            className={`${iconClass} text-red-500`}
          />
        );

      case "FORUM_SUSPENSION_ENDED":
        return (
          <CheckCircle
            className={`${iconClass} text-green-500`}
          />
        );

      default:
        return (
          <Bell className={`${iconClass} text-emerald-500`} />
        );
    }
  };

  // =========================================================
  // NOTIFICATION TIME
  // =========================================================

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
      return date.toLocaleDateString("en-IN");
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }

    if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }

    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // OPEN NOTIFICATION
  // =========================================================

  const handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }

    setNotificationOpen(false);

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      return;
    }

    // Fallback routes based on notification type.
    switch (notification.type) {
      case "POST_LIKED":
      case "POST_REPLIED":
      case "REPLY_LIKED":
      case "DISCUSSION_REPLY":
        router.push("/dashboard/community");
        break;

      case "BADGE_EARNED":
      case "ACHIEVEMENT_COMPLETED":
      case "STREAK_MILESTONE":
      case "STREAK_AT_RISK":
      case "LEVEL_UP":
      case "POINTS_EARNED":
        router.push("/dashboard/achievements");
        break;

      case "WEATHER_ALERT":
        router.push("/dashboard/weather-alerts");
        break;

      case "CROP_TASK_DUE":
      case "CROP_TASK_REMINDER":
        router.push("/dashboard/crop-calendar");
        break;

      default:
        break;
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

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
          "fixed inset-y-0 left-0 z-50 w-64 bg-emerald-950 border-r border-emerald-900 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col shadow-xl",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-900/50">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold text-white tracking-wide">
              Farm AI
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-emerald-900"
            onClick={() => setSidebarOpen(false)}
          >
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
                    ? user.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
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
                        ? "bg-emerald-900 text-white shadow-md border border-emerald-800"
                        : "text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <IconComponent
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-emerald-400/60 group-hover:text-emerald-400"
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

        {/* =====================================================
            DESKTOP TOP BAR
            ===================================================== */}
        <header className="hidden lg:flex bg-white border-b border-border px-6 py-3 items-center justify-between shrink-0 relative z-30">

          <div>
            <p className="text-sm text-muted-foreground">
              Welcome back
            </p>

            <p className="font-semibold text-gray-800">
              {user?.fullName || "Farmer"}
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* Notification Bell */}
            <div className="relative">

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                className={cn(
                  "relative rounded-full h-10 w-10 hover:bg-emerald-50",
                  notificationOpen &&
                    "bg-emerald-50 text-emerald-700"
                )}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 top-12 w-[390px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">

                  {/* Header */}
                  <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>

                      <p className="text-xs text-gray-500">
                        Stay updated with FarmAI
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="max-h-[420px] overflow-y-auto">

                    {notificationLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                        <p className="text-sm text-gray-500">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                          <Bell className="h-6 w-6 text-emerald-500" />
                        </div>

                        <h4 className="font-medium text-gray-800">
                          You're all caught up!
                        </h4>

                        <p className="text-sm text-gray-500 mt-1">
                          New likes, replies, achievements and FarmAI updates will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={cn(
                            "w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors flex gap-3",
                            notification.isRead
                              ? "bg-white hover:bg-gray-50"
                              : "bg-emerald-50/60 hover:bg-emerald-50"
                          )}
                        >

                          {/* Icon */}
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                              notification.category ===
                                "community" &&
                                "bg-blue-50",
                              notification.category ===
                                "gamification" &&
                                "bg-yellow-50",
                              notification.category ===
                                "farming" &&
                                "bg-green-50",
                              notification.category ===
                                "moderation" &&
                                "bg-red-50",
                              notification.category ===
                                "system" &&
                                "bg-gray-100"
                            )}
                          >
                            {getNotificationIcon(
                              notification
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">

                            <div className="flex items-start justify-between gap-2">

                              <p
                                className={cn(
                                  "text-sm truncate",
                                  notification.isRead
                                    ? "font-medium text-gray-700"
                                    : "font-semibold text-gray-900"
                                )}
                              >
                                {notification.title}
                              </p>

                              {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                              )}
                            </div>

                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>

                            <p className="text-[11px] text-gray-400 mt-1">
                              {formatNotificationTime(
                                notification.createdAt
                              )}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t bg-gray-50 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationOpen(false);
                          router.push(
                            "/dashboard/notifications"
                          );
                        }}
                        className="w-full py-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center justify-center gap-1"
                      >
                        View all notifications
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Avatar */}
            <Link href="/dashboard/profile">
              <Avatar className="h-9 w-9 border border-emerald-200 cursor-pointer">
                {user?.profilePhoto ? (
                  <AvatarImage
                    src={user.profilePhoto}
                    alt={user?.fullName || "Farmer"}
                  />
                ) : (
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                    {user?.fullName
                      ? user.fullName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                      : "FR"}
                  </AvatarFallback>
                )}
              </Avatar>
            </Link>
          </div>
        </header>

        {/* =====================================================
            MOBILE / TABLET TOP BAR
            ===================================================== */}
        <header className="bg-white border-b border-border px-4 py-3 lg:hidden flex items-center justify-between shrink-0 relative z-30">

          <div className="flex items-center gap-3">

            <Button
              variant="ghost"
              size="icon"
              className="-ml-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <span className="font-semibold text-lg">
              Farm AI
            </span>
          </div>

          <div className="flex items-center gap-2">

            {/* Mobile Notification Bell */}
            <div className="relative">

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                className="relative rounded-full"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Mobile Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 top-11 w-[360px] max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">

                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>

                      <p className="text-xs text-gray-500">
                        Stay updated with FarmAI
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-emerald-600 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">

                    {notificationLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-10 px-5 text-center">
                        <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />

                        <p className="font-medium text-gray-700">
                          No notifications yet
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Your FarmAI updates will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={cn(
                            "w-full text-left px-3 py-3 border-b last:border-b-0 flex gap-3",
                            notification.isRead
                              ? "bg-white"
                              : "bg-emerald-50/60"
                          )}
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            {getNotificationIcon(
                              notification
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>

                            <p className="text-xs text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-1">
                              {formatNotificationTime(
                                notification.createdAt
                              )}
                            </p>
                          </div>

                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="border-t bg-gray-50 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationOpen(false);
                          router.push(
                            "/dashboard/notifications"
                          );
                        }}
                        className="w-full py-2 text-xs text-emerald-700 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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