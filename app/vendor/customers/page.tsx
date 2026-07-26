"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Leaf,
  Loader2,
  Menu,
  MoreVertical,
  Phone,
  PlusCircle,
  Reply,
  Search,
  Send,
  Star,
  ThumbsUp,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import {
  archiveConversation,
  fetchConversations,
  fetchCustomerOrderSummary,
  fetchMessages,
  fetchVendorReviews,
  replyToReview,
  reviewsToCsv,
  sendMessage,
  subscribeToMessages,
  toggleHelpfulVote,
  type ConversationRow,
  type CustomerOrderSummary,
  type MessageRow,
  type ReviewRow,
} from "@/services/vendor-customer.service";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-primary">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className="h-4.5 w-4.5" fill={n <= rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function VendorCustomersPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "messages">("reviews");
  const [searchQuery, setSearchQuery] = useState("");

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationSearch, setConversationSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [customerSummary, setCustomerSummary] = useState<CustomerOrderSummary | null>(null);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  useEffect(() => {
    if (!vendor) return;
    let active = true;
    fetchVendorReviews(vendor.id, vendor.id)
      .then((rows) => {
        if (active) setReviews(rows);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendor?.id]);

  useEffect(() => {
    if (!vendor) return;
    let active = true;
    fetchConversations(vendor.id)
      .then((rows) => {
        if (!active) return;
        setConversations(rows);
        if (rows.length > 0) setSelectedConversationId((prev) => prev ?? rows[0].id);
      })
      .finally(() => {
        if (active) setConversationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendor?.id]);

  useEffect(() => {
    if (!selectedConversationId || !vendor) return;
    let active = true;
    fetchMessages(selectedConversationId).then((rows) => {
      if (active) setMessages(rows);
    });
    const conversation = conversations.find((c) => c.id === selectedConversationId);
    if (conversation) {
      fetchCustomerOrderSummary(vendor.id, conversation.customerId).then((summary) => {
        if (active) setCustomerSummary(summary);
      });
    }
    const unsubscribe = subscribeToMessages(selectedConversationId, (message) => {
      if (message.senderId === vendor.id) return;
      setMessages((prev) => [...prev, message]);
    });
    return () => {
      active = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, vendor?.id]);

  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
    setMobileThreadOpen(true);
  };

  const handleToggleHelpful = async (review: ReviewRow) => {
    if (!vendor) return;
    const newCount = await toggleHelpfulVote(review.id, vendor.id, review.markedHelpfulByMe);
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, helpfulCount: newCount, markedHelpfulByMe: !r.markedHelpfulByMe } : r))
    );
  };

  const handlePostReply = async (review: ReviewRow) => {
    if (!replyDraft.trim()) return;
    await replyToReview(review.id, replyDraft.trim());
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, vendorReply: replyDraft.trim(), vendorRepliedAt: new Date().toISOString() } : r))
    );
    setReplyDraft("");
    setReplyOpenId(null);
  };

  const handleSendMessage = async () => {
    if (!vendor || !selectedConversationId || !draftMessage.trim()) return;
    const body = draftMessage.trim();
    setDraftMessage("");
    await sendMessage(selectedConversationId, vendor.id, body);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), conversationId: selectedConversationId, senderId: vendor.id, body, createdAt: new Date().toISOString() },
    ]);
  };

  const handleArchive = async (conversationId: string) => {
    await archiveConversation(conversationId);
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== conversationId);
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const visibleReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => r.productTitle.toLowerCase().includes(q) || r.reviewerName.toLowerCase().includes(q));
  }, [reviews, searchQuery]);

  const handleExportReviews = () => {
    const csv = reviewsToCsv(visibleReviews);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleConversations = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.customerName.toLowerCase().includes(q));
  }, [conversations, conversationSearch]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;
  const customerTag =
    (customerSummary?.ordersCount ?? 0) >= 10 ? "LOYAL" : (customerSummary?.ordersCount ?? 0) >= 2 ? "REPEAT" : "NEW";

  if (isLoading || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">Loading dashboard…</p>
      </div>
    );
  }

  const initials = vendor.businessName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <VendorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-4 border-b border-outline-variant bg-surface/80 px-4 py-4 shadow-md backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsSidebarOpen(true)}
              className="text-on-surface-variant lg:hidden"
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search customers or reviews…"
                className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-secondary-container"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <VendorNotificationBell />
            <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-6">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{vendor.businessName}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Top Tier Vendor
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {vendor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.avatar} alt={vendor.businessName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
            <div className="mb-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Customer Relations</h2>
                <button
                  type="button"
                  onClick={handleExportReviews}
                  disabled={activeTab !== "reviews"}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                  Export Data
                </button>
              </div>

              <div className="relative flex gap-8 border-b border-outline-variant">
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`relative px-2 pb-3 text-sm transition-all ${
                    activeTab === "reviews" ? "font-bold text-primary" : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Reviews
                  {activeTab === "reviews" && <div className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("messages")}
                  className={`relative px-2 pb-3 text-sm transition-all ${
                    activeTab === "messages" ? "font-bold text-primary" : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Messages
                  {activeTab === "messages" && <div className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                </button>
              </div>
            </div>

            {activeTab === "reviews" ? (
              <div className="space-y-4">
                {reviewsLoading && (
                  <div className="flex justify-center py-10">
                    <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-outline" />
                  </div>
                )}
                {!reviewsLoading && visibleReviews.length === 0 && (
                  <p className="py-10 text-center text-sm text-on-surface-variant">No reviews yet.</p>
                )}
                {visibleReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:gap-6"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container text-3xl">
                      {review.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.productImage} alt={review.productTitle} className="h-full w-full object-cover" />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{review.productTitle}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StarRating rating={review.rating} />
                            <span className="text-sm text-on-surface-variant">
                              by {review.reviewerName} • {formatTimeAgo(review.createdAt)}
                            </span>
                          </div>
                        </div>
                        {review.verified && (
                          <span className="inline-block shrink-0 self-start rounded-full bg-secondary-container px-3 py-1 text-sm font-medium text-on-secondary-container">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="mb-4 text-on-surface-variant">&quot;{review.body}&quot;</p>

                      {review.vendorReply && (
                        <div className="mb-4 rounded-xl border-l-4 border-primary bg-primary/5 p-4">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">Your Reply</p>
                          <p className="text-sm text-foreground">{review.vendorReply}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {!review.vendorReply && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyOpenId((current) => (current === review.id ? null : review.id));
                              setReplyDraft("");
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-outline px-4 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
                          >
                            <Reply aria-hidden="true" className="h-4.5 w-4.5" />
                            Reply
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleHelpful(review)}
                          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                            review.markedHelpfulByMe ? "text-primary" : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          <ThumbsUp aria-hidden="true" className="h-4.5 w-4.5" fill={review.markedHelpfulByMe ? "currentColor" : "none"} />
                          Helpful ({review.helpfulCount})
                        </button>
                      </div>
                      {replyOpenId === review.id && (
                        <div className="mt-4 space-y-2 border-t border-outline-variant/30 pt-4">
                          <textarea
                            rows={3}
                            value={replyDraft}
                            onChange={(event) => setReplyDraft(event.target.value)}
                            placeholder={`Write a public reply to ${review.reviewerName}…`}
                            className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setReplyOpenId(null)}
                              className="rounded-lg px-4 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePostReply(review)}
                              disabled={!replyDraft.trim()}
                              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
                            >
                              Post Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm" style={{ minHeight: "560px" }}>
                <div
                  className={`w-full flex-col border-outline-variant md:flex md:w-80 md:border-r ${
                    mobileThreadOpen ? "hidden" : "flex"
                  }`}
                >
                  <div className="border-b border-outline-variant p-4">
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline"
                      />
                      <input
                        type="text"
                        value={conversationSearch}
                        onChange={(event) => setConversationSearch(event.target.value)}
                        placeholder="Search conversations…"
                        className="w-full rounded-lg border-none bg-surface-container py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {conversationsLoading && (
                      <div className="flex justify-center py-8">
                        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-outline" />
                      </div>
                    )}
                    {!conversationsLoading && visibleConversations.length === 0 && (
                      <p className="p-4 text-center text-sm text-on-surface-variant">No conversations yet.</p>
                    )}
                    {visibleConversations.map((conversation) => {
                      const isActive = conversation.id === selectedConversationId;
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => selectConversation(conversation.id)}
                          className={`flex w-full gap-3 border-l-4 p-4 text-left transition-colors ${
                            isActive ? "border-primary bg-secondary-container/20" : "border-transparent hover:bg-surface-container"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                              {conversation.customerAvatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={conversation.customerAvatarUrl} alt={conversation.customerName} className="h-full w-full object-cover" />
                              ) : (
                                initialsOf(conversation.customerName)
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <h5 className="truncate text-sm font-medium text-foreground">{conversation.customerName}</h5>
                              <span className="shrink-0 text-[10px] font-medium text-on-surface-variant">
                                {formatTimeAgo(conversation.lastMessageAt)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`relative flex-1 flex-col bg-surface-container-low/30 md:flex ${
                    mobileThreadOpen ? "flex" : "hidden"
                  }`}
                >
                  {selectedConversation ? (
                    <>
                      <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest p-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label="Back to conversations"
                            onClick={() => setMobileThreadOpen(false)}
                            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container md:hidden"
                          >
                            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                          </button>
                          <h5 className="text-lg font-semibold text-foreground">{selectedConversation.customerName}</h5>
                        </div>
                        <div className="flex gap-1">
                          <a
                            href={selectedConversation.customerPhone ? `tel:${selectedConversation.customerPhone}` : undefined}
                            aria-label="Call"
                            className={`rounded-full p-2 transition-colors hover:bg-surface-container ${
                              selectedConversation.customerPhone ? "text-on-surface-variant" : "pointer-events-none text-outline/40"
                            }`}
                          >
                            <Phone aria-hidden="true" className="h-5 w-5" />
                          </a>
                          <button
                            type="button"
                            aria-label="Archive conversation"
                            title="Archive conversation"
                            onClick={() => handleArchive(selectedConversation.id)}
                            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                          >
                            <MoreVertical aria-hidden="true" className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
                        {messages.length === 0 && (
                          <p className="text-center text-sm text-on-surface-variant">No messages yet — say hello!</p>
                        )}
                        {messages.map((message) =>
                          message.senderId !== vendor.id ? (
                            <div key={message.id} className="flex max-w-[85%] gap-3 sm:max-w-[80%]">
                              <div className="mb-1 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                                {initialsOf(selectedConversation.customerName)}
                              </div>
                              <div className="rounded-2xl rounded-bl-none bg-surface-container-highest/50 p-4 text-foreground">
                                {message.body}
                                <div className="mt-2 text-right text-[10px] text-on-surface-variant">
                                  {formatTimeAgo(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={message.id} className="ml-auto flex max-w-[85%] flex-row-reverse gap-3 sm:max-w-[80%]">
                              <div className="mb-1 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                                <Leaf aria-hidden="true" className="h-4 w-4" />
                              </div>
                              <div className="rounded-2xl rounded-br-none bg-primary p-4 text-on-primary shadow-sm">
                                {message.body}
                                <div className="mt-2 text-right text-[10px] text-primary-container">
                                  {formatTimeAgo(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="border-t border-outline-variant bg-surface-container-lowest p-4">
                        <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/50 bg-surface-container px-4 py-2">
                          <PlusCircle aria-hidden="true" className="h-5 w-5 text-on-surface-variant/40" />
                          <input
                            type="text"
                            value={draftMessage}
                            onChange={(event) => setDraftMessage(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleSendMessage();
                            }}
                            placeholder="Type a message…"
                            className="flex-1 border-none bg-transparent py-2 text-sm focus:outline-none focus:ring-0"
                          />
                          <button
                            type="button"
                            aria-label="Send message"
                            onClick={handleSendMessage}
                            disabled={!draftMessage.trim()}
                            className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md transition-transform active:scale-95 disabled:opacity-40"
                          >
                            <Send aria-hidden="true" className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-sm text-on-surface-variant">
                      No conversation selected.
                    </div>
                  )}
                </div>

                {selectedConversation && (
                  <div className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant bg-surface-container-low p-6 lg:block">
                    <div className="mb-6 text-center">
                      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary-container text-2xl font-bold text-on-primary-container ring-4 ring-primary/10">
                        {selectedConversation.customerAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedConversation.customerAvatarUrl} alt={selectedConversation.customerName} className="h-full w-full object-cover" />
                        ) : (
                          initialsOf(selectedConversation.customerName)
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedConversation.customerName}</h3>
                      <p className="text-sm text-on-surface-variant">
                        Customer since{" "}
                        {new Date(selectedConversation.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </p>
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold text-on-primary-container">
                          {customerTag}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                          Quick Info
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-on-surface-variant">Total Spend</span>
                            <span className="text-sm font-bold text-foreground">${(customerSummary?.totalSpend ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-on-surface-variant">Orders</span>
                            <span className="text-sm font-bold text-foreground">{customerSummary?.ordersCount ?? 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-on-surface-variant">Last Order</span>
                            <span className="text-sm font-bold text-foreground">
                              {customerSummary?.lastOrderAt ? formatTimeAgo(customerSummary.lastOrderAt) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                          Recent Orders
                        </h4>
                        <div className="space-y-3">
                          {(customerSummary?.recentOrders ?? []).length === 0 && (
                            <p className="text-xs text-on-surface-variant">No orders from this vendor yet.</p>
                          )}
                          {(customerSummary?.recentOrders ?? []).map((order, index) => (
                            <div
                              key={`${order.title}-${index}`}
                              className="flex gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-container text-lg">
                                📦
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-foreground">{order.title}</p>
                                <p className="text-[10px] capitalize text-on-surface-variant">
                                  {order.status} • {formatTimeAgo(order.date)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-outline-variant bg-surface-container-low p-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-primary">EcoMart</span>
              <p className="text-sm text-on-surface-variant">© {new Date().getFullYear()} EcoMart Vendor Solutions</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
                Support
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
