"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Heart,
  Trophy,
  Flame,
  Sprout,
  AlertCircle,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;

  // Optional fields depending on notification type
  link?: string;
  relatedId?: string;
  relatedModel?: string;
  senderName?: string;
  senderAvatar?: string;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  total?: number;
}

const API_URL = "http://localhost:5000/api/notifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Failed to fetch notifications:",
          response.status
        );
        return;
      }

      const data: NotificationResponse = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // =========================================================
  // INITIAL LOAD + AUTOMATIC REFRESH
  // =========================================================

  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // =========================================================

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to mark notification as read"
        );
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      setMarkingAll(true);

      const response = await fetch(
        `${API_URL}/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to mark all notifications as read"
        );
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const deleteNotification = async (
    notificationId: string
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      const response = await fetch(
        `${API_URL}/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to delete notification"
        );
        return;
      }

      setNotifications((previous) =>
        previous.filter(
          (item) => item._id !== notificationId
        )
      );

      if (notification && !notification.isRead) {
        setUnreadCount((previous) =>
          Math.max(0, previous - 1)
        );
      }
    } catch (error) {
      console.error(
        "Error deleting notification:",
        error
      );
    }
  };

  // =========================================================
  // HANDLE NOTIFICATION CLICK
  // =========================================================

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      window.location.href = notification.link;
      return;
    }

    // Default navigation based on notification type
    switch (notification.type) {
      case "forum_reply":
      case "forum_like":
      case "forum_post":
        window.location.href =
          "/dashboard/community";
        break;

      case "badge":
      case "achievement":
      case "streak":
      case "gamification":
        window.location.href =
          "/dashboard/achievements";
        break;

      case "weather":
        window.location.href =
          "/dashboard/weather-alerts";
        break;

      case "market":
        window.location.href =
          "/dashboard/market-prices";
        break;

      case "news":
        window.location.href =
          "/dashboard/news";
        break;

      default:
        break;
    }
  };

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "forum_reply":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
        );

      case "forum_like":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
            <Heart className="h-5 w-5 text-red-600" />
          </div>
        );

      case "badge":
      case "achievement":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100">
            <Trophy className="h-5 w-5 text-yellow-600" />
          </div>
        );

      case "streak":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
            <Flame className="h-5 w-5 text-orange-600" />
          </div>
        );

      case "weather":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100">
            <AlertCircle className="h-5 w-5 text-cyan-600" />
          </div>
        );

      case "farm":
      case "crop":
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
            <Sprout className="h-5 w-5 text-green-600" />
          </div>
        );

      default:
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
            <Bell className="h-5 w-5 text-emerald-600" />
          </div>
        );
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatNotificationTime = (
    dateString: string
  ) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Notification Bell */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen((previous) => !previous);

          if (!isOpen) {
            fetchNotifications(false);
          }
        }}
        className="relative h-10 w-10 rounded-full hover:bg-emerald-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-emerald-800" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-0.5
              -top-0.5
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-[10px]
              font-bold
              text-white
              ring-2
              ring-white
            "
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          className="
            absolute
            right-0
            top-12
            z-[100]
            w-[380px]
            max-w-[calc(100vw-2rem)]
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-2xl
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-white px-4 py-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Notifications
              </h3>

              <p className="text-xs text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount > 1 ? "s" : ""
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={markingAll}
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  {markingAll ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  )}
                  Mark all read
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-3 h-6 w-6 animate-spin text-emerald-600" />
                <p className="text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <Bell className="h-7 w-7 text-emerald-500" />
                </div>

                <h4 className="font-semibold text-gray-900">
                  No notifications yet
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  We'll let you know when something
                  important happens.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`
                    group
                    relative
                    flex
                    cursor-pointer
                    gap-3
                    border-b
                    px-4
                    py-3
                    transition-colors
                    hover:bg-gray-50
                    ${
                      !notification.isRead
                        ? "bg-emerald-50/60"
                        : "bg-white"
                    }
                  `}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                >
                  {/* Icon */}
                  <div className="shrink-0">
                    {getNotificationIcon(
                      notification.type
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pr-8">
                    <div className="flex items-start gap-2">
                      <h4
                        className={`
                          text-sm
                          ${
                            !notification.isRead
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-800"
                          }
                        `}
                      >
                        {notification.title}
                      </h4>

                      {!notification.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-600">
                      {notification.message}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      {notification.senderName && (
                        <span className="text-[11px] font-medium text-gray-500">
                          {notification.senderName}
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400">
                        {formatNotificationTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="
                      absolute
                      right-2
                      top-2
                      flex
                      flex-col
                      opacity-0
                      transition-opacity
                      group-hover:opacity-100
                    "
                  >
                    {!notification.isRead && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white"
                        title="Mark as read"
                        onClick={(event) => {
                          event.stopPropagation();
                          markAsRead(
                            notification._id
                          );
                        }}
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-white hover:bg-red-50"
                      title="Delete notification"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteNotification(
                          notification._id
                        );
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t bg-gray-50 px-4 py-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href =
                    "/dashboard/notifications";
                }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}