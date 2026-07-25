"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  Landmark,
  MapPin,
  Menu,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";

type OrderStatus = "Processing" | "Pending" | "Shipped" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  customerName: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  date: string;
  amount: string;
  payment: { label: string; icon: typeof CreditCard };
  status: OrderStatus;
};

const orders: Order[] = [
  {
    id: "ORD-2948",
    customerName: "Elena Martinez",
    initials: "EM",
    avatarBg: "bg-secondary-container",
    avatarColor: "text-on-secondary-container",
    date: "Oct 24, 2023, 11:30 AM",
    amount: "$142.50",
    payment: { label: "Visa", icon: CreditCard },
    status: "Processing",
  },
  {
    id: "ORD-2949",
    customerName: "James Smith",
    initials: "JS",
    avatarBg: "bg-tertiary-fixed",
    avatarColor: "text-on-tertiary-fixed",
    date: "Oct 24, 2023, 12:15 PM",
    amount: "$68.20",
    payment: { label: "Apple Pay", icon: Wallet },
    status: "Pending",
  },
  {
    id: "ORD-2950",
    customerName: "Linda Chen",
    initials: "LC",
    avatarBg: "bg-primary-fixed",
    avatarColor: "text-on-primary-fixed",
    date: "Oct 23, 2023, 04:45 PM",
    amount: "$215.00",
    payment: { label: "Stripe", icon: Landmark },
    status: "Shipped",
  },
  {
    id: "ORD-2951",
    customerName: "Ben King",
    initials: "BK",
    avatarBg: "bg-outline-variant",
    avatarColor: "text-on-surface",
    date: "Oct 23, 2023, 02:10 PM",
    amount: "$45.00",
    payment: { label: "Mastercard", icon: CreditCard },
    status: "Cancelled",
  },
];

const statusStyles: Record<OrderStatus, string> = {
  Processing: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Shipped: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-tertiary-container text-on-tertiary-container",
  Cancelled: "bg-error-container text-on-error-container",
};

const tabs = [
  { id: "all", label: "All", count: 124 },
  { id: "pending", label: "Pending", count: 12 },
  { id: "processing", label: "Processing", count: 8 },
  { id: "shipped", label: "Shipped", count: null },
  { id: "delivered", label: "Delivered", count: null },
  { id: "cancelled", label: "Cancelled", count: null },
] as const;

type TabId = (typeof tabs)[number]["id"];

const pageNumbers = [1, 2, 3, "…", 13];

export default function VendorOrdersPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  useEffect(() => {
    document.body.style.overflow = isPanelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPanelOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPanelOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsPanelOpen(true);
  };

  const closeDetails = () => setIsPanelOpen(false);

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

  const visibleOrders = activeTab === "all" ? orders : orders.filter((order) => order.status.toLowerCase() === activeTab);

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
                placeholder="Search orders, customers, IDs…"
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
                  Verified Vendor
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="mb-1 text-2xl font-semibold text-foreground sm:text-3xl">Orders &amp; Logistics</h2>
                <p className="text-sm text-on-surface-variant sm:text-base">
                  Manage your incoming orders and fulfillment workflow.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-surface-container"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-2 text-sm font-medium text-on-primary shadow-md shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
                >
                  <Plus aria-hidden="true" className="h-5 w-5" />
                  Create Manual Order
                </button>
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
              <div className="flex overflow-x-auto border-b border-outline-variant">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative min-w-fit px-6 py-4 text-sm font-medium transition-colors hover:bg-surface-container-low ${
                        isActive ? "font-bold text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                            tab.id === "all"
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                      {isActive && <div className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-6 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-outline-variant accent-primary" />
                      </th>
                      <th className="whitespace-nowrap px-6 py-4">Order ID</th>
                      <th className="whitespace-nowrap px-6 py-4">Customer Name</th>
                      <th className="whitespace-nowrap px-6 py-4">Date</th>
                      <th className="whitespace-nowrap px-6 py-4">Amount</th>
                      <th className="whitespace-nowrap px-6 py-4">Payment</th>
                      <th className="whitespace-nowrap px-6 py-4">Status</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-sm">
                    {visibleOrders.map((order) => {
                      const PaymentIcon = order.payment.icon;
                      return (
                        <tr
                          key={order.id}
                          onClick={() => openDetails(order)}
                          className="group cursor-pointer transition-colors hover:bg-surface-container/30"
                        >
                          <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                            <input type="checkbox" className="h-4 w-4 rounded border-outline-variant accent-primary" />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-bold text-foreground">#{order.id}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${order.avatarBg} ${order.avatarColor}`}
                              >
                                {order.initials}
                              </div>
                              <span>{order.customerName}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant">{order.date}</td>
                          <td className="whitespace-nowrap px-6 py-4 font-bold">{order.amount}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <PaymentIcon aria-hidden="true" className="h-[18px] w-[18px] text-on-surface-variant" />
                              {order.payment.label}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[order.status]}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight
                              aria-hidden="true"
                              className="h-5 w-5 text-outline transition-colors group-hover:text-primary"
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {visibleOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                          No orders in this view yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-lowest p-6 sm:flex-row">
                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-bold">1-{visibleOrders.length}</span> of{" "}
                  <span className="font-bold">124</span> orders
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-30"
                  >
                    <ChevronLeft aria-hidden="true" className="h-[18px] w-[18px]" />
                  </button>
                  {pageNumbers.map((page, index) =>
                    typeof page === "number" ? (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-primary text-on-primary"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={`ellipsis-${index}`} className="text-on-surface-variant">
                        {page}
                      </span>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(13, page + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    <ChevronRight aria-hidden="true" className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
            </div>

            <footer className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant py-8 text-on-surface-variant sm:flex-row">
              <p className="text-sm">© {new Date().getFullYear()} EcoMart Vendor Solutions</p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href="#" className="transition-colors hover:text-primary">
                  Terms of Service
                </a>
                <a href="#" className="transition-colors hover:text-primary">
                  Privacy Policy
                </a>
                <a href="#" className="transition-colors hover:text-primary">
                  Support
                </a>
              </div>
            </footer>
          </div>
        </section>
      </main>

      <div
        onClick={closeDetails}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isPanelOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-2xl flex-col bg-surface-container-lowest shadow-2xl transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={closeDetails}
              aria-label="Close order details"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-foreground">
                Order #{selectedOrder?.id ?? "—"}
              </h3>
              <p className="text-xs uppercase tracking-wider text-outline">
                Placed on {selectedOrder?.date.split(",").slice(0, 2).join(",") ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button
              type="button"
              title="Print Invoice"
              className="rounded-2xl border border-outline-variant p-2 transition-colors hover:bg-surface-container"
            >
              <Printer aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Share Details"
              className="rounded-2xl border border-outline-variant p-2 transition-colors hover:bg-surface-container"
            >
              <Share2 aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-10 overflow-y-auto p-4 sm:p-8">
          <div className="space-y-6">
            <h4 className="text-xs font-medium uppercase tracking-wider text-outline">Order Timeline</h4>
            <div className="relative space-y-8 pl-8">
              <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-outline-variant" />
              <div className="relative">
                <div className="absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary ring-4 ring-surface-container-lowest">
                  <Check aria-hidden="true" className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Order Placed</p>
                  <p className="text-sm text-on-surface-variant">Oct 24, 11:30 AM • Customer checkout completed.</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary ring-4 ring-surface-container-lowest">
                  <Check aria-hidden="true" className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Payment Confirmed</p>
                  <p className="text-sm text-on-surface-variant">Oct 24, 11:32 AM • Payment authorized via Visa.</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[27px] top-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-4 ring-surface-container-lowest">
                  <RefreshCw aria-hidden="true" className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-700">Processing</p>
                  <p className="text-sm text-on-surface-variant">Order is being packed and prepared for pickup.</p>
                </div>
              </div>
              <div className="relative opacity-30">
                <div className="absolute -left-[27px] top-1 h-5 w-5 rounded-full bg-outline-variant ring-4 ring-surface-container-lowest" />
                <div>
                  <p className="text-sm font-medium text-foreground">Shipped</p>
                  <p className="text-sm text-on-surface-variant">Awaiting courier pickup.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-outline">Customer Details</h4>
              <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
                    EM
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Elena Martinez</p>
                    <p className="text-sm text-on-surface-variant">elenam@example.com</p>
                  </div>
                </div>
                <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Phone aria-hidden="true" className="h-[18px] w-[18px]" />
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-outline">Shipping Address</h4>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-sm text-foreground">
                  123 Green Garden Drive
                  <br />
                  Oak Creek, CA 95014
                  <br />
                  United States
                </p>
                <button className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  <MapPin aria-hidden="true" className="h-[18px] w-[18px]" />
                  View on map
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-medium uppercase tracking-wider text-outline">Order Items</h4>
            <div className="overflow-hidden rounded-2xl border border-outline-variant">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-xs font-medium">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-sm">
                    <tr>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container text-lg">
                            👜
                          </div>
                          <span className="font-medium">Organic Cotton Tote (Large)</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">2</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-bold">$45.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-surface-container-low/50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        Total
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-lg font-semibold text-primary">
                        $45.00
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-outline-variant bg-surface-container-low p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block px-1 text-[10px] font-bold uppercase text-outline">Order Status</label>
              <select className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest py-2.5 text-sm focus:border-primary focus:ring-primary">
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full rounded-2xl bg-primary px-6 py-2.5 text-sm font-medium text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 sm:w-auto">
                Update Status
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 text-sm font-medium transition-colors hover:bg-surface-container">
              <ClipboardList aria-hidden="true" className="h-5 w-5" />
              Packing Slip
            </button>
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 text-sm font-medium transition-colors hover:bg-surface-container">
              <Truck aria-hidden="true" className="h-5 w-5" />
              Add Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
