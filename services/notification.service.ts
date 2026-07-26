import { supabase } from "@/lib/supabase";

export type NotificationType = "order_update" | "vendor_message" | "promotional" | "system" | "review" | "refund_update";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
};

export async function fetchNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link_url, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function deleteNotification(id: string): Promise<void> {
  await supabase.from("notifications").delete().eq("id", id);
}

/** Subscribes to new notifications for this user in real time. Call the
 * returned function to unsubscribe (e.g. in a useEffect cleanup). */
export function subscribeToNotifications(userId: string, onInsert: (notification: Notification) => void): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as Notification)
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
