"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageCircle,
  Trophy,
  Flame,
  Star,
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle2,
  CloudRain,
  CalendarDays,
  TrendingUp,
  Newspaper,
  FlaskConical,
  Settings,
  Trash2,
  Check,
  ArrowLeft,
  RefreshCw,
  Sprout,
  Info,
} from "lucide-react";

interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id?: string;
    fullName?: string;
    profilePhoto?: string;
  } | null;
  senderName?: string;
  type: string;
  category: "community" | "gamification" | "farming" | "system";
  title: string;
  message: string;
  icon?: string;
  relatedId?: string | null;
  relatedModel?: string | null;
  link?: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

type FilterType =
  | "all"
  | "community"
  | "gamification"
  | "farming"
  | "system";

// ============================================================
// API BASE URL
// ============================================================
//
// Notifications are handled by the Express backend
// running on port 5000.
//
// IMPORTANT:
// We intentionally use the backend URL directly here.
// This prevents Next.js (port 3000) from returning
// its HTML 404 page instead of the notification JSON.
//

const API_BASE = "http://localhost:5000/api";

// ============================================================
// FILTER OPTIONS
// ============================================================

const filterOptions: {
  value: FilterType;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "community", label: "Community" },
  { value: "gamification", label: "Achievements" },
  { value: "farming", label: "Farming" },
  { value: "system", label: "System" },
];

// ============================================================
// NOTIFICATION ICON
// ============================================================

function getNotificationIcon(type: string) {
  switch (type) {
    case "post_like":
    case "reply_like":
      return Heart;

    case "post_reply":
      return MessageCircle;

    case "badge_earned":
      return Trophy;

    case "streak":
    case "streak_milestone":
      return Flame;

    case "xp_earned":
      return Star;

    case "level_up":
      return Trophy;

    case "forum_warning":
      return AlertTriangle;

    case "forum_suspension":
      return Clock;

    case "forum_suspension_ended":
      return CheckCircle2;

    case "forum_banned":
      return Ban;

    case "weather_alert":
      return CloudRain;

    case "crop_task":
      return CalendarDays;

    case "market_update":
      return TrendingUp;

    case "agri_news":
      return Newspaper;

    case "soil_reminder":
      return FlaskConical;

    case "system":
      return Settings;

    default:
      return Bell;
  }
}

// ============================================================
// ICON CONTAINER CLASS
// ============================================================

function getIconContainerClass(type: string) {
  switch (type) {
    case "post_like":
    case "reply_like":
      return "bg-rose-50 text-rose-600";

    case "post_reply":
      return "bg-blue-50 text-blue-600";

    case "badge_earned":
    case "level_up":
      return "bg-amber-50 text-amber-600";

    case "streak":
    case "streak_milestone":
      return "bg-orange-50 text-orange-600";

    case "xp_earned":
      return "bg-yellow-50 text-yellow-600";

    case "forum_warning":
      return "bg-red-50 text-red-600";

    case "forum_suspension":
      return "bg-orange-50 text-orange-600";

    case "forum_suspension_ended":
      return "bg-emerald-50 text-emerald-600";

    case "forum_banned":
      return "bg-red-50 text-red-700";

    case "weather_alert":
      return "bg-sky-50 text-sky-600";

    case "crop_task":
      return "bg-green-50 text-green-600";

    case "market_update":
      return "bg-indigo-50 text-indigo-600";

    case "agri_news":
      return "bg-purple-50 text-purple-600";

    case "soil_reminder":
      return "bg-teal-50 text-teal-600";

    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const seconds = Math.floor(
    difference / 1000
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const hours = Math.floor(
    minutes / 60
  );

  const days = Math.floor(
    hours / 24
  );

  if (seconds < 30) {
    return "Just now";
  }

  if (minutes < 1) {
    return `${seconds}s ago`;
  }

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function NotificationsPage() {
  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilterType>("all");

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    markingId,
    setMarkingId,
  ] = useState<string | null>(null);

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Please login again to view notifications."
        );
        return;
      }

      const category =
        activeFilter === "all"
          ? ""
          : `&category=${activeFilter}`;

      const response = await fetch(
        `${API_BASE}/notifications?page=1&limit=50${category}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // --------------------------------------------------------
      // SAFELY READ RESPONSE
      // --------------------------------------------------------
      //
      // Previously response.json() was used directly.
      //
      // When the frontend accidentally requested localhost:3000,
      // Next.js returned an HTML 404 page beginning with:
      //
      // <!DOCTYPE ...
      //
      // That caused:
      //
      // Unexpected token '<'
      //
      // We now read the response as text first and safely parse it.
      //

      const responseText =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "Notification API returned non-JSON response:",
          responseText
        );

        throw new Error(
          "Notification server returned an invalid response. Please check the backend connection."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to load notifications."
        );
      }

      setNotifications(
        data.notifications || []
      );

      setUnreadCount(
        data.unreadCount || 0
      );
    } catch (err: any) {
      console.error(
        "Notification fetch error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // INITIAL LOAD + FILTER CHANGE
  // ============================================================

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  const markAsRead = async (
    notificationId: string
  ) => {
    try {
      setMarkingId(notificationId);

      const token = getToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Invalid response from notification server."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to mark notification as read."
        );
      }

      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification._id ===
              notificationId
                ? {
                    ...notification,
                    isRead: true,
                    readAt:
                      new Date().toISOString(),
                  }
                : notification
          )
      );

      setUnreadCount(
        (previous) =>
          Math.max(0, previous - 1)
      );
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err
      );
    } finally {
      setMarkingId(null);
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const markAllAsRead = async () => {
    try {
      const token = getToken();

      if (
        !token ||
        unreadCount === 0
      ) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Invalid response from notification server."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to mark all notifications as read."
        );
      }

      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              isRead: true,
              readAt:
                notification.readAt ||
                new Date().toISOString(),
            })
          )
      );

      setUnreadCount(0);
    } catch (err) {
      console.error(
        "Mark all notifications error:",
        err
      );
    }
  };

  // ============================================================
  // DELETE ONE NOTIFICATION
  // ============================================================

  const deleteNotification = async (
    notificationId: string
  ) => {
    try {
      setDeletingId(notificationId);

      const token = getToken();

      if (!token) {
        return;
      }

      const notification =
        notifications.find(
          (item) =>
            item._id === notificationId
        );

      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseText =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Invalid response from notification server."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete notification."
        );
      }

      setNotifications(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !== notificationId
          )
      );

      if (
        notification &&
        !notification.isRead
      ) {
        setUnreadCount(
          (previous) =>
            Math.max(
              0,
              previous - 1
            )
        );
      }
    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // DELETE ALL READ
  // ============================================================

  const deleteAllRead = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/notifications/read/all`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseText =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Invalid response from notification server."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete read notifications."
        );
      }

      setNotifications(
        (previous) =>
          previous.filter(
            (notification) =>
              !notification.isRead
          )
      );
    } catch (err) {
      console.error(
        "Delete read notifications error:",
        err
      );
    }
  };

  // ============================================================
  // OPEN NOTIFICATION
  // ============================================================

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (!notification.isRead) {
      await markAsRead(
        notification._id
      );
    }

    if (
      notification.link &&
      notification.link.trim()
    ) {
      window.location.href =
        notification.link;
    }
  };

  // ============================================================
  // CATEGORY COUNTS
  // ============================================================

  const communityCount =
    notifications.filter(
      (notification) =>
        notification.category ===
        "community"
    ).length;

  const gamificationCount =
    notifications.filter(
      (notification) =>
        notification.category ===
        "gamification"
    ).length;

  const farmingCount =
    notifications.filter(
      (notification) =>
        notification.category ===
        "farming"
    ).length;

  const systemCount =
    notifications.filter(
      (notification) =>
        notification.category ===
        "system"
    ).length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-full bg-background">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <Link
              href="/dashboard"
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-bold tracking-tight text-emerald-950 md:text-3xl">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                    {unreadCount} new
                  </span>
                )}

              </div>

              <p className="mt-1 text-sm text-slate-500 md:text-base">
                Stay updated with everything
                happening in FarmAI.
              </p>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={() =>
                fetchNotifications(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                onClick={
                  markAllAsRead
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />

                Mark all read
              </button>
            )}

          </div>
        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">

          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Bell className="h-5 w-5" />
          </div>

          <p className="text-2xl font-bold text-emerald-950">
            {notifications.length}
          </p>

          <p className="text-xs text-slate-500">
            Notifications
          </p>

        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">

          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MessageCircle className="h-5 w-5" />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {communityCount}
          </p>

          <p className="text-xs text-slate-500">
            Community
          </p>

        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">

          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {gamificationCount}
          </p>

          <p className="text-xs text-slate-500">
            Achievements
          </p>

        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">

          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Sprout className="h-5 w-5" />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {farmingCount +
              systemCount}
          </p>

          <p className="text-xs text-slate-500">
            Farm & System
          </p>

        </div>

      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="mb-5 overflow-x-auto rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm">

        <div className="flex min-w-max gap-2">

          {filterOptions.map(
            (filter) => {

              const isActive =
                activeFilter ===
                filter.value;

              return (
                <button
                  key={
                    filter.value
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter.value
                    )
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {filter.label}
                </button>
              );
            }
          )}

          <div className="ml-auto hidden md:block">

            <button
              onClick={
                deleteAllRead
              }
              disabled={
                !notifications.some(
                  (notification) =>
                    notification.isRead
                )
              }
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />

              Clear read
            </button>

          </div>

        </div>
      </div>

      {/* ======================================================
          MOBILE CLEAR BUTTON
      ====================================================== */}

      {notifications.some(
        (notification) =>
          notification.isRead
      ) && (
        <div className="mb-4 flex justify-end md:hidden">

          <button
            onClick={
              deleteAllRead
            }
            className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600"
          >
            <Trash2 className="h-4 w-4" />

            Clear read
          </button>

        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">

            <p className="font-semibold">
              Unable to load notifications
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

            <button
              onClick={() =>
                fetchNotifications()
              }
              className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>

          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="space-y-3">

          {[1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-emerald-100 bg-white p-5"
              >
                <div className="flex gap-4">

                  <div className="h-12 w-12 rounded-full bg-slate-200" />

                  <div className="flex-1">

                    <div className="mb-2 h-4 w-1/3 rounded bg-slate-200" />

                    <div className="mb-2 h-3 w-2/3 rounded bg-slate-200" />

                    <div className="h-3 w-20 rounded bg-slate-200" />

                  </div>

                </div>
              </div>
            )
          )}

        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Bell className="h-9 w-9" />
            </div>

            <h2 className="text-xl font-bold text-emerald-950">
              You're all caught up!
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {activeFilter ===
              "all"
                ? "You don't have any notifications yet. We'll let you know when something important happens."
                : `There are no ${activeFilter} notifications right now.`}
            </p>

            {activeFilter !==
              "all" && (
              <button
                onClick={() =>
                  setActiveFilter(
                    "all"
                  )
                }
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                View all notifications
              </button>
            )}

          </div>
        )}

      {/* ======================================================
          NOTIFICATION LIST
      ====================================================== */}

      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div className="space-y-3">

            {notifications.map(
              (notification) => {

                const Icon =
                  getNotificationIcon(
                    notification.type
                  );

                const iconClass =
                  getIconContainerClass(
                    notification.type
                  );

                return (
                  <div
                    key={
                      notification._id
                    }
                    className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md md:p-5 ${
                      notification.isRead
                        ? "border-slate-100"
                        : "border-emerald-200 bg-emerald-50/20"
                    }`}
                  >

                    {/* Unread indicator */}

                    {!notification.isRead && (
                      <span className="absolute left-0 top-5 h-10 w-1 rounded-r-full bg-emerald-500" />
                    )}

                    <div className="flex gap-3 md:gap-4">

                      {/* Icon */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">

                          <div className="pr-8">

                            <h3
                              className={`text-sm md:text-base ${
                                notification.isRead
                                  ? "font-semibold text-slate-800"
                                  : "font-bold text-emerald-950"
                              }`}
                            >
                              {
                                notification.title
                              }
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {
                                notification.message
                              }
                            </p>

                          </div>

                          <span className="shrink-0 text-xs text-slate-400">
                            {formatTime(
                              notification.createdAt
                            )}
                          </span>

                        </div>

                        {/* Sender */}

                        {notification.senderName && (
                          <div className="mt-2 flex items-center gap-2">

                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">

                              {notification.senderName
                                .split(" ")
                                .map(
                                  (
                                    name
                                  ) =>
                                    name[0]
                                )
                                .join("")
                                .slice(
                                  0,
                                  2
                                )
                                .toUpperCase()}

                            </div>

                            <span className="text-xs font-medium text-slate-500">
                              {
                                notification.senderName
                              }
                            </span>

                          </div>
                        )}

                        {/* Metadata */}

                        {notification.metadata &&
                          Object.keys(
                            notification.metadata
                          ).length >
                            0 && (
                            <div className="mt-2 flex flex-wrap gap-2">

                              {notification
                                .metadata
                                .streakDays && (
                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                  {
                                    notification
                                      .metadata
                                      .streakDays
                                  }{" "}
                                  day streak
                                </span>
                              )}

                              {notification
                                .metadata
                                .xp && (
                                <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                                  +
                                  {
                                    notification
                                      .metadata
                                      .xp
                                  }{" "}
                                  XP
                                </span>
                              )}

                              {notification
                                .metadata
                                .badgeName && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  {
                                    notification
                                      .metadata
                                      .badgeName
                                  }
                                </span>
                              )}

                            </div>
                          )}

                        {/* Actions */}

                        <div className="mt-3 flex flex-wrap items-center gap-2">

                          {notification.link && (
                            <button
                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              View
                            </button>
                          )}

                          {!notification.isRead && (
                            <button
                              onClick={() =>
                                markAsRead(
                                  notification._id
                                )
                              }
                              disabled={
                                markingId ===
                                notification._id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />

                              {markingId ===
                              notification._id
                                ? "Saving..."
                                : "Mark as read"}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              deleteNotification(
                                notification._id
                              )
                            }
                            disabled={
                              deletingId ===
                              notification._id
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />

                            Delete
                          </button>

                        </div>

                      </div>

                      {/* Unread dot */}

                      {!notification.isRead && (
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                      )}

                    </div>
                  </div>
                );
              }
            )}

          </div>
        )}

      {/* ======================================================
          FOOTER INFO
      ====================================================== */}

      {!loading &&
        notifications.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">

            <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <div>

              <p className="text-sm font-semibold text-emerald-900">
                Stay connected with FarmAI
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-800/70">
                You'll receive notifications
                for community activity,
                achievements, farming
                updates, reminders and
                important FarmAI
                information.
              </p>

            </div>

          </div>
        )}

    </div>
  );
}