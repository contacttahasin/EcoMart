"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Download,
  Leaf,
  Menu,
  MoreVertical,
  Paperclip,
  Phone,
  PlusCircle,
  Reply,
  Search,
  Send,
  Smile,
  Star,
  ThumbsUp,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";

type Review = {
  id: string;
  productName: string;
  emoji: string;
  rating: number;
  reviewerName: string;
  timeAgo: string;
  verified: boolean;
  text: string;
  helpfulCount: number;
};

const initialReviews: Review[] = [
  {
    id: "rev-1",
    productName: "Organic Bamboo Utensil Set",
    emoji: "🍴",
    rating: 5,
    reviewerName: "Sarah Jenkins",
    timeAgo: "2 hours ago",
    verified: true,
    text: "Absolutely love these! The quality is much better than I expected. They feel very durable and look beautiful in my kitchen. Shipping was surprisingly fast too. Highly recommend for anyone looking to reduce plastic use.",
    helpfulCount: 12,
  },
  {
    id: "rev-2",
    productName: "Botanical Solid Shampoo Bar",
    emoji: "🧼",
    rating: 4,
    reviewerName: "Marcus Chen",
    timeAgo: "Yesterday",
    verified: true,
    text: "Great smell and lathers surprisingly well for a solid bar. My hair feels clean without that waxy residue. Only giving 4 stars because the packaging was slightly crushed on arrival, but the product itself is 5 stars.",
    helpfulCount: 3,
  },
];

type Message = { id: string; from: "customer" | "vendor"; text: string; time: string };

type Conversation = {
  id: string;
  name: string;
  initials: string;
  time: string;
  preview: string;
  online: boolean;
  since: string;
  tags: string[];
  totalSpend: string;
  orders: number;
  lastOrder: string;
  recentOrders: { name: string; status: string; faded?: boolean }[];
  messages: Message[];
};

const conversations: Conversation[] = [
  {
    id: "emma",
    name: "Emma Thompson",
    initials: "ET",
    time: "10:45 AM",
    preview: "Hey! Is the eco-tote back in stock soon?",
    online: true,
    since: "Customer since Oct 2023",
    tags: ["LOYAL", "ECO-PREMIUM"],
    totalSpend: "$428.50",
    orders: 12,
    lastOrder: "12 days ago",
    recentOrders: [
      { name: "Glass Soap Dispenser Set", status: "Delivered • Jan 24" },
      { name: "Natural Cork Yoga Mat", status: "Delivered • Dec 15", faded: true },
    ],
    messages: [
      {
        id: "m1",
        from: "customer",
        text: "Hello! I was browsing your store and saw the recycled cotton tote bags. They look great, but I noticed the 'Sage Green' is currently out of stock. Do you know when you might have more?",
        time: "10:42 AM",
      },
      {
        id: "m2",
        from: "vendor",
        text: "Hi Emma! Thanks for reaching out. We're actually receiving a new shipment this Thursday! I can send you a notification as soon as they're back on the site if you'd like?",
        time: "10:44 AM",
      },
      {
        id: "m3",
        from: "customer",
        text: "That would be wonderful, thank you so much! Also, does the tote come with a zipper?",
        time: "10:45 AM",
      },
    ],
  },
  {
    id: "david",
    name: "David Miller",
    initials: "DM",
    time: "Yesterday",
    preview: "Thank you for the quick shipping!",
    online: false,
    since: "Customer since Feb 2024",
    tags: ["REPEAT"],
    totalSpend: "$96.00",
    orders: 3,
    lastOrder: "2 days ago",
    recentOrders: [{ name: "Bamboo Toothbrush Set", status: "Delivered • 2 days ago" }],
    messages: [{ id: "m1", from: "customer", text: "Thank you for the quick shipping!", time: "Yesterday" }],
  },
  {
    id: "sofia",
    name: "Sofia Rodriguez",
    initials: "SR",
    time: "Wed",
    preview: "I had a question about the detergent...",
    online: false,
    since: "Customer since May 2024",
    tags: ["NEW"],
    totalSpend: "$32.00",
    orders: 1,
    lastOrder: "5 days ago",
    recentOrders: [{ name: "Bio-Degradable Detergent", status: "Processing • 5 days ago" }],
    messages: [{ id: "m1", from: "customer", text: "I had a question about the detergent...", time: "Wed" }],
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-primary">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className="h-4.5 w-4.5" fill={n <= rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

export default function VendorCustomersPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "messages">("reviews");
  const [reviews, setReviews] = useState(initialReviews);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [helpfulMarked, setHelpfulMarked] = useState<Record<string, boolean>>({});
  const [selectedConversationId, setSelectedConversationId] = useState(conversations[0].id);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

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

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? conversations[0];

  const toggleHelpful = (id: string) => {
    setHelpfulMarked((prev) => ({ ...prev, [id]: !prev[id] }));
    setReviews((prev) =>
      prev.map((review) =>
        review.id === id
          ? { ...review, helpfulCount: review.helpfulCount + (helpfulMarked[id] ? -1 : 1) }
          : review
      )
    );
  };

  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
    setMobileThreadOpen(true);
  };

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
                placeholder="Search customers or reviews…"
                className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-secondary-container"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 transition-all hover:bg-surface-container-high/50"
            >
              <Bell aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-6">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{vendor.businessName}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Top Tier Vendor
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {initials}
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
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
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:gap-6"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-container text-3xl">
                      {review.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{review.productName}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StarRating rating={review.rating} />
                            <span className="text-sm text-on-surface-variant">
                              by {review.reviewerName} • {review.timeAgo}
                            </span>
                          </div>
                        </div>
                        {review.verified && (
                          <span className="inline-block shrink-0 self-start rounded-full bg-secondary-container px-3 py-1 text-sm font-medium text-on-secondary-container">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="mb-4 text-on-surface-variant">&quot;{review.text}&quot;</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setReplyOpenId((current) => (current === review.id ? null : review.id))}
                          className="flex items-center gap-1.5 rounded-lg border border-outline px-4 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
                        >
                          <Reply aria-hidden="true" className="h-4.5 w-4.5" />
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleHelpful(review.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                            helpfulMarked[review.id] ? "text-primary" : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          <ThumbsUp
                            aria-hidden="true"
                            className="h-4.5 w-4.5"
                            fill={helpfulMarked[review.id] ? "currentColor" : "none"}
                          />
                          Helpful ({review.helpfulCount})
                        </button>
                      </div>
                      {replyOpenId === review.id && (
                        <div className="mt-4 space-y-2 border-t border-outline-variant/30 pt-4">
                          <textarea
                            rows={3}
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
                              onClick={() => setReplyOpenId(null)}
                              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-on-primary hover:opacity-90"
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
                        placeholder="Search conversations…"
                        className="w-full rounded-lg border-none bg-surface-container py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {conversations.map((conversation) => {
                      const isActive = conversation.id === selectedConversationId;
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => selectConversation(conversation.id)}
                          className={`flex w-full gap-3 border-l-4 p-4 text-left transition-colors ${
                            isActive
                              ? "border-primary bg-secondary-container/20"
                              : "border-transparent hover:bg-surface-container"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                              {conversation.initials}
                            </div>
                            {conversation.online && (
                              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface-container-lowest bg-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <h5 className="truncate text-sm font-medium text-foreground">{conversation.name}</h5>
                              <span className="shrink-0 text-[10px] font-medium text-on-surface-variant">
                                {conversation.time}
                              </span>
                            </div>
                            <p className="truncate text-sm text-on-surface-variant">{conversation.preview}</p>
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
                      <h5 className="text-lg font-semibold text-foreground">{selectedConversation.name}</h5>
                      {selectedConversation.online && (
                        <span className="rounded bg-secondary-container/50 px-2 py-0.5 text-[10px] uppercase text-on-secondary-container">
                          Active Now
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Call"
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                      >
                        <Phone aria-hidden="true" className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="More options"
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                      >
                        <MoreVertical aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
                    {selectedConversation.messages.map((message) =>
                      message.from === "customer" ? (
                        <div key={message.id} className="flex max-w-[85%] gap-3 sm:max-w-[80%]">
                          <div className="mb-1 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                            {selectedConversation.initials}
                          </div>
                          <div className="rounded-2xl rounded-bl-none bg-surface-container-highest/50 p-4 text-foreground">
                            {message.text}
                            <div className="mt-2 text-right text-[10px] text-on-surface-variant">{message.time}</div>
                          </div>
                        </div>
                      ) : (
                        <div key={message.id} className="ml-auto flex max-w-[85%] flex-row-reverse gap-3 sm:max-w-[80%]">
                          <div className="mb-1 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                            <Leaf aria-hidden="true" className="h-4 w-4" />
                          </div>
                          <div className="rounded-2xl rounded-br-none bg-primary p-4 text-on-primary shadow-sm">
                            {message.text}
                            <div className="mt-2 text-right text-[10px] text-primary-container">{message.time}</div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="border-t border-outline-variant bg-surface-container-lowest p-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/50 bg-surface-container px-4 py-2">
                      <button
                        type="button"
                        aria-label="Add attachment options"
                        className="text-on-surface-variant transition-colors hover:text-primary"
                      >
                        <PlusCircle aria-hidden="true" className="h-5 w-5" />
                      </button>
                      <input
                        type="text"
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        placeholder="Type a message…"
                        className="flex-1 border-none bg-transparent py-2 text-sm focus:outline-none focus:ring-0"
                      />
                      <div className="flex items-center gap-1 border-l border-outline-variant/30 pl-2">
                        <button
                          type="button"
                          aria-label="Emoji"
                          className="p-1 text-on-surface-variant transition-colors hover:text-primary"
                        >
                          <Smile aria-hidden="true" className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Attach file"
                          className="p-1 text-on-surface-variant transition-colors hover:text-primary"
                        >
                          <Paperclip aria-hidden="true" className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Send message"
                          onClick={() => setDraftMessage("")}
                          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md transition-transform active:scale-95"
                        >
                          <Send aria-hidden="true" className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant bg-surface-container-low p-6 lg:block">
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container text-2xl font-bold text-on-primary-container ring-4 ring-primary/10">
                      {selectedConversation.initials}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedConversation.name}</h3>
                    <p className="text-sm text-on-surface-variant">{selectedConversation.since}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {selectedConversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold text-on-primary-container"
                        >
                          {tag}
                        </span>
                      ))}
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
                          <span className="text-sm font-bold text-foreground">{selectedConversation.totalSpend}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-on-surface-variant">Orders</span>
                          <span className="text-sm font-bold text-foreground">{selectedConversation.orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-on-surface-variant">Last Order</span>
                          <span className="text-sm font-bold text-foreground">{selectedConversation.lastOrder}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                        Recent Orders
                      </h4>
                      <div className="space-y-3">
                        {selectedConversation.recentOrders.map((order) => (
                          <div
                            key={order.name}
                            className={`flex gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 ${
                              order.faded ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-container text-lg">
                              📦
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">{order.name}</p>
                              <p className="text-[10px] text-on-surface-variant">{order.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full rounded-xl border border-primary py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
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
