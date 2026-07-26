"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { formatRelativeTime } from "@/lib/format";
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
  type Notification,
} from "@/services/notification.service";

type NotificationBellProps = {
  buttonClassName?: string;
};

const DEFAULT_BUTTON_CLASS = "p-1.5 text-on-surface-variant transition-transform hover:text-primary active:scale-90 sm:p-2";

export function NotificationBell({ buttonClassName = DEFAULT_BUTTON_CLASS }: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [list, count] = await Promise.all([fetchNotifications(user.id), fetchUnreadCount(user.id)]);
    setNotifications(list);
    setUnreadCount(count);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button type="button" aria-label="Notifications" className={buttonClassName} disabled>
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    );
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  };

  const handleItemClick = async (notification: Notification) => {
    if (notification.read_at) return;
    await markNotificationAsRead(notification.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDelete = async (event: React.MouseEvent, notification: Notification) => {
    event.stopPropagation();
    await deleteNotification(notification.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    if (!notification.read_at) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setIsOpen((value) => !value)}
        className={`relative ${buttonClassName}`}
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl">
          <div className="flex items-center justify-between border-b border-outline-variant p-4">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-on-surface-variant">No notifications yet.</p>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(notification)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") handleItemClick(notification);
                }}
                className={`flex w-full items-start gap-3 border-b border-outline-variant/50 p-4 text-left transition-colors hover:bg-surface-container ${
                  notification.read_at ? "" : "bg-secondary-container/10"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ${
                    notification.read_at ? "invisible" : ""
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{notification.title}</span>
                  {notification.body && (
                    <span className="block truncate text-xs text-on-surface-variant">{notification.body}</span>
                  )}
                  <span className="mt-1 block text-[10px] text-on-surface-variant">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Delete notification"
                  onClick={(event) => handleDelete(event, notification)}
                  className="flex-shrink-0 rounded-full p-1 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
