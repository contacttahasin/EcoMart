"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  Landmark,
  Loader2,
  MapPin,
  Menu,
  Phone,
  Plus,
  Printer,
  Search,
  Share2,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import {
  addTrackingNumber,
  createManualOrder,
  fetchOrderTimeline,
  fetchVendorActiveProducts,
  fetchVendorOrders,
  ordersToCsv,
  updateOrderItemStatus,
  type ItemStatus,
  type PaymentMethod,
  type TimelineEvent,
  type VendorOrderRow,
  type VendorProductOption,
} from "@/services/vendor-order.service";

type TabId = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<ItemStatus, string> = {
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-emerald-100 text-emerald-700",
  delivered: "bg-tertiary-container text-on-tertiary-container",
  cancelled: "bg-error-container text-on-error-container",
  returned: "bg-error-container text-on-error-container",
};

const paymentMeta: Record<PaymentMethod, { label: string; icon: typeof CreditCard }> = {
  card: { label: "Card", icon: CreditCard },
  bkash: { label: "bKash", icon: Wallet },
  nagad: { label: "Nagad", icon: Landmark },
};

const avatarStyles = [
  { bg: "bg-secondary-container", color: "text-on-secondary-container" },
  { bg: "bg-tertiary-fixed", color: "text-on-tertiary-fixed" },
  { bg: "bg-primary-fixed", color: "text-on-primary-fixed" },
  { bg: "bg-outline-variant", color: "text-on-surface" },
];

const PAGE_SIZE = 10;

function tabMatches(order: VendorOrderRow, tab: TabId): boolean {
  if (tab === "all") return true;
  if (tab === "pending") return order.itemStatus === "processing" && order.paymentStatus !== "paid";
  if (tab === "processing") return order.itemStatus === "processing" && order.paymentStatus === "paid";
  if (tab === "cancelled") return order.itemStatus === "cancelled" || order.itemStatus === "returned";
  return order.itemStatus === tab;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function generatePageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("…");
    result.push(page);
  });
  return result;
}

function printDocument(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body { font-family: -apple-system, sans-serif; padding: 32px; color: #1b211d; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; font-size: 14px; }
      .muted { color: #666; font-size: 13px; }
    </style></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function VendorOrdersPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrderRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [orders, setOrders] = useState<VendorOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [statusDraft, setStatusDraft] = useState<ItemStatus>("processing");
  const [statusSaving, setStatusSaving] = useState(false);

  const [trackingDraft, setTrackingDraft] = useState("");
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [trackingSaving, setTrackingSaving] = useState(false);

  const [shareCopied, setShareCopied] = useState(false);

  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualProducts, setManualProducts] = useState<VendorProductOption[]>([]);
  const [manualForm, setManualForm] = useState({
    customerEmail: "",
    productId: "",
    quantity: "1",
    shippingName: "",
    shippingPhone: "",
    shippingStreet: "",
    shippingCity: "",
  });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  const vendorId = vendor?.id;

  const loadOrders = useCallback(async () => {
    if (!vendorId) return;
    try {
      const rows = await fetchVendorOrders(vendorId);
      setOrders(rows);
      setOrdersError(null);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    fetchVendorOrders(vendorId)
      .then((rows) => {
        if (!active) return;
        setOrders(rows);
        setOrdersError(null);
      })
      .catch((err) => {
        if (!active) return;
        setOrdersError(err instanceof Error ? err.message : "Could not load orders.");
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  useEffect(() => {
    document.body.style.overflow = isPanelOpen || isManualOrderOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPanelOpen, isManualOrderOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
        setIsManualOrderOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openDetails = async (order: VendorOrderRow) => {
    setSelectedOrder(order);
    setStatusDraft(order.itemStatus);
    setTrackingDraft(order.trackingNumber ?? "");
    setIsEditingTracking(false);
    setShareCopied(false);
    setIsPanelOpen(true);
    setTimeline([]);
    try {
      const events = await fetchOrderTimeline(order.orderItemId);
      setTimeline(events);
    } catch {
      setTimeline([]);
    }
  };

  const closeDetails = () => setIsPanelOpen(false);

  const filteredBySearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (order) => order.orderNumber.toLowerCase().includes(q) || order.customerName.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    tabs.forEach((tab) => {
      counts[tab.id] = filteredBySearch.filter((order) => tabMatches(order, tab.id)).length;
    });
    return counts;
  }, [filteredBySearch]);

  const visibleOrders = useMemo(
    () => filteredBySearch.filter((order) => tabMatches(order, activeTab)),
    [filteredBySearch, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / PAGE_SIZE));
  const pageNumbers = generatePageNumbers(Math.min(currentPage, totalPages), totalPages);
  const paginatedOrders = visibleOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filterKey = `${activeTab}|${searchQuery}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const allVisibleSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.orderItemId));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        paginatedOrders.forEach((o) => next.delete(o.orderItemId));
      } else {
        paginatedOrders.forEach((o) => next.add(o.orderItemId));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = () => {
    const csv = ordersToCsv(visibleOrders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !vendor || statusDraft === selectedOrder.itemStatus) return;
    setStatusSaving(true);
    try {
      await updateOrderItemStatus(selectedOrder.orderItemId, selectedOrder.orderId, statusDraft, vendor.id);
      setOrders((prev) =>
        prev.map((o) => (o.orderItemId === selectedOrder.orderItemId ? { ...o, itemStatus: statusDraft } : o))
      );
      setSelectedOrder((prev) => (prev ? { ...prev, itemStatus: statusDraft } : prev));
      const events = await fetchOrderTimeline(selectedOrder.orderItemId);
      setTimeline(events);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder || !trackingDraft.trim()) return;
    setTrackingSaving(true);
    try {
      await addTrackingNumber(selectedOrder.orderItemId, trackingDraft.trim());
      setOrders((prev) =>
        prev.map((o) =>
          o.orderItemId === selectedOrder.orderItemId ? { ...o, trackingNumber: trackingDraft.trim() } : o
        )
      );
      setSelectedOrder((prev) => (prev ? { ...prev, trackingNumber: trackingDraft.trim() } : prev));
      setIsEditingTracking(false);
    } finally {
      setTrackingSaving(false);
    }
  };

  const handleShare = async () => {
    if (!selectedOrder) return;
    const summary = `Order #${selectedOrder.orderNumber} — ${selectedOrder.customerName} — $${selectedOrder.lineTotal.toFixed(2)} — ${selectedOrder.itemStatus}`;
    if (navigator.share) {
      // navigator.share() can hang indefinitely rather than reject when no
      // share target is available (observed in headless/automated Chrome,
      // and plausible on some desktop setups) — race it against a timeout
      // so the button always falls back to copying instead of freezing.
      const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 1500));
      const shared = await Promise.race([
        navigator.share({ title: `Order #${selectedOrder.orderNumber}`, text: summary }).then(() => "shared"),
        timeout,
      ]).catch(() => "failed");
      if (shared === "shared") return;
    }
    await navigator.clipboard.writeText(summary);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    printDocument(
      `Invoice ${selectedOrder.orderNumber}`,
      `<h1>Invoice — Order #${selectedOrder.orderNumber}</h1>
       <p class="muted">Placed ${formatDate(selectedOrder.placedAt)}</p>
       <p><b>Customer:</b> ${selectedOrder.customerName}${selectedOrder.customerPhone ? ` (${selectedOrder.customerPhone})` : ""}</p>
       <table><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
       <tbody><tr><td>${selectedOrder.productTitle}</td><td>${selectedOrder.quantity}</td><td>$${selectedOrder.unitPrice.toFixed(2)}</td><td>$${selectedOrder.lineTotal.toFixed(2)}</td></tr></tbody></table>`
    );
  };

  const handlePrintPackingSlip = () => {
    if (!selectedOrder) return;
    const addr = selectedOrder.shippingAddress;
    printDocument(
      `Packing Slip ${selectedOrder.orderNumber}`,
      `<h1>Packing Slip — Order #${selectedOrder.orderNumber}</h1>
       <p><b>Ship to:</b> ${addr?.full_name ?? selectedOrder.customerName}<br/>${addr?.street ?? ""}<br/>${addr?.city ?? ""} ${addr?.state ?? ""} ${addr?.zip_code ?? ""}<br/>${addr?.country ?? ""}</p>
       <table><thead><tr><th>Item</th><th>Qty</th></tr></thead>
       <tbody><tr><td>${selectedOrder.productTitle}</td><td>${selectedOrder.quantity}</td></tr></tbody></table>`
    );
  };

  const handleViewOnMap = () => {
    const addr = selectedOrder?.shippingAddress;
    if (!addr) return;
    const query = [addr.street, addr.city, addr.state, addr.zip_code, addr.country].filter(Boolean).join(", ");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
  };

  const openManualOrderModal = async () => {
    setManualError(null);
    setIsManualOrderOpen(true);
    if (vendor) {
      const products = await fetchVendorActiveProducts(vendor.id);
      setManualProducts(products);
      setManualForm((prev) => ({ ...prev, productId: products[0]?.id ?? "" }));
    }
  };

  const handleCreateManualOrder = async () => {
    if (!manualForm.customerEmail || !manualForm.productId) {
      setManualError("Customer email and product are required.");
      return;
    }
    setManualSaving(true);
    setManualError(null);
    try {
      await createManualOrder({
        customerEmail: manualForm.customerEmail,
        productId: manualForm.productId,
        quantity: Number(manualForm.quantity) || 1,
        shippingName: manualForm.shippingName,
        shippingPhone: manualForm.shippingPhone,
        shippingStreet: manualForm.shippingStreet,
        shippingCity: manualForm.shippingCity,
      });
      setIsManualOrderOpen(false);
      setManualForm({
        customerEmail: "",
        productId: "",
        quantity: "1",
        shippingName: "",
        shippingPhone: "",
        shippingStreet: "",
        shippingCity: "",
      });
      await loadOrders();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Could not create the order.");
    } finally {
      setManualSaving(false);
    }
  };

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

  const currentStepOrder: ItemStatus[] = ["processing", "shipped", "delivered"];
  const currentStepIndex = selectedOrder ? currentStepOrder.indexOf(selectedOrder.itemStatus) : -1;
  const isTerminalNegative = selectedOrder?.itemStatus === "cancelled" || selectedOrder?.itemStatus === "returned";

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
                placeholder="Search orders, customers, IDs…"
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
                  Verified Vendor
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
                  onClick={handleExportCsv}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-surface-container"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={openManualOrderModal}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-2 text-sm font-medium text-on-primary shadow-md shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
                >
                  <Plus aria-hidden="true" className="h-5 w-5" />
                  Create Manual Order
                </button>
              </div>
            </div>

            {ordersError && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
                <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
                {ordersError}
              </div>
            )}

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
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                          tab.id === "all"
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {tabCounts[tab.id]}
                      </span>
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
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-outline-variant accent-primary"
                        />
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
                    {ordersLoading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                          <Loader2 aria-hidden="true" className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!ordersLoading &&
                      paginatedOrders.map((order, index) => {
                        const PaymentIcon = paymentMeta[order.paymentMethod].icon;
                        const avatarStyle = avatarStyles[index % avatarStyles.length];
                        return (
                          <tr
                            key={order.orderItemId}
                            onClick={() => openDetails(order)}
                            className="group cursor-pointer transition-colors hover:bg-surface-container/30"
                          >
                            <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(order.orderItemId)}
                                onChange={() => toggleSelectOne(order.orderItemId)}
                                className="h-4 w-4 rounded border-outline-variant accent-primary"
                              />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 font-bold text-foreground">
                              #{order.orderNumber}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${avatarStyle.bg} ${avatarStyle.color}`}
                                >
                                  {order.customerAvatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={order.customerAvatarUrl} alt={order.customerName} className="h-full w-full object-cover" />
                                  ) : (
                                    initialsOf(order.customerName)
                                  )}
                                </div>
                                <span>{order.customerName}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant">
                              {formatDate(order.placedAt)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 font-bold">${order.lineTotal.toFixed(2)}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <PaymentIcon aria-hidden="true" className="h-[18px] w-[18px] text-on-surface-variant" />
                                {paymentMeta[order.paymentMethod].label}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[order.itemStatus]}`}
                              >
                                {order.itemStatus}
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
                    {!ordersLoading && visibleOrders.length === 0 && (
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
                  Showing{" "}
                  <span className="font-bold">
                    {visibleOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, visibleOrders.length)}
                  </span>{" "}
                  of <span className="font-bold">{visibleOrders.length}</span> orders
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
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-30"
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

      {/* Order details drawer */}
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-foreground">
                Order #{selectedOrder?.orderNumber ?? "—"}
              </h3>
              <p className="text-xs uppercase tracking-wider text-outline">
                Placed on {selectedOrder ? formatDate(selectedOrder.placedAt) : "—"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              title="Print Invoice"
              onClick={handlePrintInvoice}
              className="rounded-2xl border border-outline-variant p-2 transition-colors hover:bg-surface-container"
            >
              <Printer aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Share Details"
              onClick={handleShare}
              className="rounded-2xl border border-outline-variant p-2 transition-colors hover:bg-surface-container"
            >
              {shareCopied ? <Check aria-hidden="true" className="h-5 w-5 text-primary" /> : <Share2 aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {selectedOrder && (
          <>
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
                      <p className="text-sm text-on-surface-variant">{formatDate(selectedOrder.placedAt)} • Order created.</p>
                    </div>
                  </div>

                  <div className={`relative ${selectedOrder.paymentStatus === "paid" ? "" : "opacity-40"}`}>
                    <div
                      className={`absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-surface-container-lowest ${
                        selectedOrder.paymentStatus === "paid" ? "bg-primary text-on-primary" : "bg-outline-variant"
                      }`}
                    >
                      {selectedOrder.paymentStatus === "paid" && <Check aria-hidden="true" className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Payment Confirmed</p>
                      <p className="text-sm text-on-surface-variant">
                        {selectedOrder.paymentStatus === "paid"
                          ? `Payment authorized via ${paymentMeta[selectedOrder.paymentMethod].label}.`
                          : `Payment ${selectedOrder.paymentStatus}.`}
                      </p>
                    </div>
                  </div>

                  {timeline.map((event) => (
                    <div key={event.createdAt + event.status} className="relative">
                      <div className="absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary ring-4 ring-surface-container-lowest">
                        <Check aria-hidden="true" className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize text-foreground">{event.status}</p>
                        <p className="text-sm text-on-surface-variant">
                          {formatDate(event.createdAt)} {event.note ? `• ${event.note}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}

                  {!isTerminalNegative &&
                    currentStepOrder.slice(currentStepIndex + 1).map((step) => (
                      <div key={step} className="relative opacity-30">
                        <div className="absolute -left-[27px] top-1 h-5 w-5 rounded-full bg-outline-variant ring-4 ring-surface-container-lowest" />
                        <div>
                          <p className="text-sm font-medium capitalize text-foreground">{step}</p>
                          <p className="text-sm text-on-surface-variant">Awaiting update.</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-outline">Customer Details</h4>
                  <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-container font-bold text-on-primary-container">
                        {selectedOrder.customerAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedOrder.customerAvatarUrl} alt={selectedOrder.customerName} className="h-full w-full object-cover" />
                        ) : (
                          initialsOf(selectedOrder.customerName)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedOrder.customerName}</p>
                      </div>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Phone aria-hidden="true" className="h-[18px] w-[18px]" />
                      {selectedOrder.customerPhone || "No phone on file"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-outline">Shipping Address</h4>
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    {selectedOrder.shippingAddress ? (
                      <p className="text-sm text-foreground">
                        {selectedOrder.shippingAddress.street}
                        <br />
                        {[selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state, selectedOrder.shippingAddress.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                        <br />
                        {selectedOrder.shippingAddress.country}
                      </p>
                    ) : (
                      <p className="text-sm text-on-surface-variant">No shipping address on file for this order.</p>
                    )}
                    <button
                      onClick={handleViewOnMap}
                      disabled={!selectedOrder.shippingAddress}
                      className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                    >
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
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container text-lg">
                                {selectedOrder.productImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={selectedOrder.productImage} alt={selectedOrder.productTitle} className="h-full w-full object-cover" />
                                ) : (
                                  "📦"
                                )}
                              </div>
                              <span className="font-medium">{selectedOrder.productTitle}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">{selectedOrder.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-right font-bold">
                            ${selectedOrder.lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-surface-container-low/50">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-foreground">
                            Total
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-lg font-semibold text-primary">
                            ${selectedOrder.lineTotal.toFixed(2)}
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
                  <select
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value as ItemStatus)}
                    className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest py-2.5 text-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={statusSaving || statusDraft === selectedOrder.itemStatus}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-medium text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto"
                  >
                    {statusSaving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                    Update Status
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={handlePrintPackingSlip}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 text-sm font-medium transition-colors hover:bg-surface-container"
                >
                  <ClipboardList aria-hidden="true" className="h-5 w-5" />
                  Packing Slip
                </button>
                {isEditingTracking ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={trackingDraft}
                      onChange={(event) => setTrackingDraft(event.target.value)}
                      placeholder="Tracking number"
                      className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleSaveTracking}
                      disabled={trackingSaving}
                      className="shrink-0 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingTracking(true)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 text-sm font-medium transition-colors hover:bg-surface-container"
                  >
                    <Truck aria-hidden="true" className="h-5 w-5" />
                    {selectedOrder.trackingNumber ? `Tracking: ${selectedOrder.trackingNumber}` : "Add Tracking"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Manual Order modal */}
      <div
        onClick={() => setIsManualOrderOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isManualOrderOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {isManualOrderOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create manual order"
          className="fixed left-1/2 top-1/2 z-[90] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface-container-lowest p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Create Manual Order</h3>
            <button
              type="button"
              onClick={() => setIsManualOrderOpen(false)}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          {manualError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              {manualError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-outline">Customer Email</label>
              <input
                type="email"
                value={manualForm.customerEmail}
                onChange={(event) => setManualForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
                placeholder="customer@example.com"
                className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-outline">Product</label>
              <select
                value={manualForm.productId}
                onChange={(event) => setManualForm((prev) => ({ ...prev, productId: event.target.value }))}
                className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              >
                {manualProducts.length === 0 && <option value="">No active products</option>}
                {manualProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} — ${(product.salePrice ?? product.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-outline">Quantity</label>
              <input
                type="number"
                min={1}
                value={manualForm.quantity}
                onChange={(event) => setManualForm((prev) => ({ ...prev, quantity: event.target.value }))}
                className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={manualForm.shippingName}
                onChange={(event) => setManualForm((prev) => ({ ...prev, shippingName: event.target.value }))}
                placeholder="Recipient name"
                className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              />
              <input
                value={manualForm.shippingPhone}
                onChange={(event) => setManualForm((prev) => ({ ...prev, shippingPhone: event.target.value }))}
                placeholder="Phone"
                className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={manualForm.shippingStreet}
                onChange={(event) => setManualForm((prev) => ({ ...prev, shippingStreet: event.target.value }))}
                placeholder="Street address"
                className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              />
              <input
                value={manualForm.shippingCity}
                onChange={(event) => setManualForm((prev) => ({ ...prev, shippingCity: event.target.value }))}
                placeholder="City"
                className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleCreateManualOrder}
            disabled={manualSaving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {manualSaving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Create Order
          </button>
        </div>
      )}
    </div>
  );
}
