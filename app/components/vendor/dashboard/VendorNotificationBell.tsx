"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
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

const DEFAULT_BUTTON_CLASS = "relative rounded-full p-2 transition-all hover:bg-surface-container-high/50";

type VendorNotificationBellProps = {
  buttonClassName?: string;
};

export function VendorNotificationBell({ buttonClassName = DEFAULT_BUTTON_CLASS }: VendorNotificationBellProps) {
  const { vendor } = useVendorAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vendor) return;
    let active = true;
    Promise.all([fetchNotifications(vendor.id), fetchUnreadCount(vendor.id)]).then(([list, count]) => {
      if (!active) return;
      setNotifications(list);
      setUnreadCount(count);
    });
    return () => {
      active = false;
    };
  }, [vendor]);

  useEffect(() => {
    if (!vendor) return;
    return subscribeToNotifications(vendor.id, (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });
  }, [vendor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!vendor) return;
    await markAllNotificationsAsRead(vendor.id);
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
        className={buttonClassName}
      >
        <Bell aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
        {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />}
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
