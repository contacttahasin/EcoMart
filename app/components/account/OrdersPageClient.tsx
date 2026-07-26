"use client";

import { ChevronDown, Download, Package, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { getProductsByIds } from "@/services/product.service";
import {
  fetchOrderStatusHistory,
  formatOrderDate,
  STATUS_BADGE,
  type OrderStatus,
  type OrderStatusEvent,
  type RealOrder,
} from "@/services/order.service";

const TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE = 3;

type OrdersPageClientProps = {
  orders: RealOrder[];
};

function buildInvoiceHtml(order: RealOrder): string {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td>${item.title}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">$${item.unitPrice.toFixed(2)}</td><td style="text-align:right">$${(item.unitPrice * item.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title>
<style>body{font-family:sans-serif;padding:2rem;color:#222}table{width:100%;border-collapse:collapse;margin-top:1.5rem}th,td{padding:8px;border-bottom:1px solid #ddd}th{text-align:left}h1{color:#0f7a4f}</style>
</head><body>
<h1>EcoMarket</h1>
<h2>Invoice</h2>
<p><strong>Order #${order.orderNumber}</strong><br/>Placed on ${formatOrderDate(order.placedAt)}</p>
<table>
<thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="text-align:right;font-size:1.1rem;margin-top:1rem"><strong>Grand Total: $${order.totalAmount.toFixed(2)}</strong></p>
</body></html>`;
}

function downloadInvoice(order: RealOrder) {
  const blob = new Blob([buildInvoiceHtml(order)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${order.orderNumber}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function OrdersPageClient({ orders }: OrdersPageClientProps) {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusEvent[]>([]);
  const [isBuyingAgainId, setIsBuyingAgainId] = useState<string | null>(null);
  const { addItem } = useCart();
  const router = useRouter();

  const filtered = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab);
  const visible = filtered.slice(0, visibleCount);

  const handleViewDetails = (orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  };

  const handleTrackOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    setStatusHistory(await fetchOrderStatusHistory(orderId));
  };

  const handleBuyAgain = async (order: RealOrder) => {
    setIsBuyingAgainId(order.id);
    const productIds = order.items.map((item) => item.productId).filter((id): id is string => id !== null);
    const products = await getProductsByIds(productIds);
    for (const item of order.items) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (product) addItem(product, item.quantity);
    }
    setIsBuyingAgainId(null);
    router.push("/cart");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Orders</h1>
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-outline-variant pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-b-2 border-primary text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center text-on-surface-variant">
            No {activeTab === "all" ? "" : activeTab} orders here yet.
          </div>
        )}

        {visible.map((order) => {
          const badge = STATUS_BADGE[order.status];
          const BadgeIcon = badge.icon;
          const [firstItem, ...restItems] = order.items;
          const isExpanded = expandedOrderId === order.id;

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="flex flex-col items-start gap-4 md:flex-row">
                <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-xl bg-surface-container md:w-32">
                  <Package aria-hidden="true" className="h-8 w-8 text-on-surface-variant" />
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        {firstItem?.title ?? "Order"}
                        {restItems.length > 0 && (
                          <span className="ml-1 text-sm font-normal text-on-surface-variant">
                            +{restItems.length} more
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-on-surface-variant">
                        Order ID: <span className="font-bold text-foreground">#{order.orderNumber}</span>
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      <BadgeIcon aria-hidden="true" className="h-3.5 w-3.5" />
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-outline">Placed On</p>
                      <p className="text-sm text-foreground">{formatOrderDate(order.placedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-outline">Total Price</p>
                      <p className="text-sm font-bold text-foreground">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-on-surface-variant">
                        <span>
                          {item.title} × {item.quantity}
                        </span>
                        <span className="font-medium text-foreground">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {statusHistory.length > 0 && (
                    <div className="border-t border-outline-variant/50 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-outline">Order Timeline</p>
                      <div className="space-y-1.5">
                        {statusHistory.map((event) => (
                          <div key={event.id} className="flex justify-between text-xs text-on-surface-variant">
                            <span>{event.note ?? event.status}</span>
                            <span>{formatOrderDate(event.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => downloadInvoice(order)}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Download Invoice
                  </button>
                  {order.status === "delivered" && (
                    <button
                      type="button"
                      onClick={() => handleBuyAgain(order)}
                      disabled={isBuyingAgainId === order.id}
                      className="flex items-center gap-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary disabled:opacity-50"
                    >
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      Buy Again
                    </button>
                  )}
                </div>

                {order.status === "shipped" && (
                  <button
                    type="button"
                    onClick={() => handleTrackOrder(order.id)}
                    className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:bg-secondary active:scale-95"
                  >
                    {isExpanded ? "Hide Tracking" : "Track Order"}
                  </button>
                )}
                {order.status === "delivered" && (
                  <button
                    type="button"
                    onClick={() => handleViewDetails(order.id)}
                    className="rounded-lg border border-primary px-6 py-2 text-sm font-bold text-primary transition-all hover:bg-surface-container-low active:scale-95"
                  >
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                )}
                {order.status === "processing" && (
                  <button type="button" disabled className="cursor-not-allowed rounded-lg bg-surface-variant px-6 py-2 text-sm font-bold text-on-surface-variant">
                    Preparing Order
                  </button>
                )}
                {order.status === "cancelled" && (
                  <button type="button" disabled className="cursor-not-allowed rounded-lg bg-surface-variant px-6 py-2 text-sm font-bold text-on-surface-variant">
                    Order Cancelled
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {visibleCount < filtered.length && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Show More Orders
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
