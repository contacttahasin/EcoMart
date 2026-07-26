import { supabase } from "@/lib/supabase";

export type ReviewRow = {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  rating: number;
  reviewerName: string;
  createdAt: string;
  verified: boolean;
  body: string;
  helpfulCount: number;
  vendorReply: string | null;
  vendorRepliedAt: string | null;
  markedHelpfulByMe: boolean;
};

type RawReview = {
  id: string;
  product_id: string;
  rating: number;
  body: string;
  helpful_count: number;
  vendor_reply: string | null;
  vendor_replied_at: string | null;
  order_item_id: string | null;
  created_at: string;
  products: { title: string; product_images: { url: string }[] } | null;
  profiles: { full_name: string } | null;
};

export async function fetchVendorReviews(vendorId: string, currentUserId: string): Promise<ReviewRow[]> {
  const [reviewsRes, votesRes] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        `id, product_id, rating, body, helpful_count, vendor_reply, vendor_replied_at, order_item_id, created_at,
         products ( title, product_images ( url ) ),
         profiles!reviews_customer_id_fkey ( full_name )`
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
    supabase.from("review_helpful_votes").select("review_id").eq("user_id", currentUserId),
  ]);
  if (reviewsRes.error) throw new Error(reviewsRes.error.message);

  const myVotes = new Set((votesRes.data ?? []).map((v) => v.review_id));

  return ((reviewsRes.data ?? []) as unknown as RawReview[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productTitle: row.products?.title ?? "Product",
    productImage: row.products?.product_images?.[0]?.url ?? null,
    rating: row.rating,
    reviewerName: row.profiles?.full_name ?? "Customer",
    createdAt: row.created_at,
    verified: row.order_item_id !== null,
    body: row.body,
    helpfulCount: row.helpful_count,
    vendorReply: row.vendor_reply,
    vendorRepliedAt: row.vendor_replied_at,
    markedHelpfulByMe: myVotes.has(row.id),
  }));
}

export async function replyToReview(reviewId: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({ vendor_reply: reply, vendor_replied_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) throw new Error(error.message);
}

export async function toggleHelpfulVote(reviewId: string, userId: string, currentlyMarked: boolean): Promise<number> {
  if (currentlyMarked) {
    await supabase.from("review_helpful_votes").delete().eq("review_id", reviewId).eq("user_id", userId);
  } else {
    await supabase.from("review_helpful_votes").insert({ review_id: reviewId, user_id: userId });
  }
  const { count } = await supabase
    .from("review_helpful_votes")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId);
  const newCount = count ?? 0;
  await supabase.from("reviews").update({ helpful_count: newCount }).eq("id", reviewId);
  return newCount;
}

export type ConversationRow = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerAvatarUrl: string | null;
  lastMessageAt: string;
  createdAt: string;
};

type RawConversation = {
  id: string;
  customer_id: string;
  last_message_at: string;
  created_at: string;
  profiles: { full_name: string; phone: string | null; avatar_url: string | null } | null;
};

export async function fetchConversations(vendorId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, customer_id, last_message_at, created_at, profiles ( full_name, phone, avatar_url )")
    .eq("vendor_id", vendorId)
    .eq("archived", false)
    .order("last_message_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawConversation[]).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.profiles?.full_name ?? "Customer",
    customerPhone: row.profiles?.phone || null,
    customerAvatarUrl: row.profiles?.avatar_url ?? null,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  }));
}

export type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<void> {
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw new Error(error.message);
}

export function subscribeToMessages(conversationId: string, onInsert: (message: MessageRow) => void): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const row = payload.new as {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        onInsert({
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          body: row.body,
          createdAt: row.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Customer-side entry point into the same conversations/messages tables the
 * vendor inbox (app/vendor/customers/page.tsx) already reads from. Reuses an
 * existing thread if one exists — un-archiving it if the vendor had archived
 * it, since a new customer message means it's active again.
 */
export async function getOrCreateConversation(customerId: string, vendorId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, archived")
    .eq("customer_id", customerId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (existing) {
    if (existing.archived) {
      await supabase.from("conversations").update({ archived: false }).eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ customer_id: customerId, vendor_id: vendorId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not start conversation.");
  return created.id;
}

export async function archiveConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from("conversations").update({ archived: true }).eq("id", conversationId);
  if (error) throw new Error(error.message);
}

export type CustomerOrderSummary = {
  totalSpend: number;
  ordersCount: number;
  lastOrderAt: string | null;
  recentOrders: { title: string; status: string; date: string }[];
};

export async function fetchCustomerOrderSummary(vendorId: string, customerId: string): Promise<CustomerOrderSummary> {
  const { data } = await supabase
    .from("order_items")
    .select("product_title_snapshot, item_status, line_total, created_at, orders!inner ( customer_id )")
    .eq("vendor_id", vendorId)
    .eq("orders.customer_id", customerId)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const totalSpend = rows.reduce((sum, r) => sum + Number(r.line_total), 0);
  return {
    totalSpend,
    ordersCount: rows.length,
    lastOrderAt: rows[0]?.created_at ?? null,
    recentOrders: rows.slice(0, 3).map((r) => ({
      title: r.product_title_snapshot,
      status: r.item_status,
      date: r.created_at,
    })),
  };
}

export function reviewsToCsv(rows: ReviewRow[]): string {
  const header = ["Product", "Reviewer", "Rating", "Verified", "Body", "Helpful"];
  const lines = rows.map((row) =>
    [row.productTitle, row.reviewerName, String(row.rating), row.verified ? "Yes" : "No", row.body, String(row.helpfulCount)]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
