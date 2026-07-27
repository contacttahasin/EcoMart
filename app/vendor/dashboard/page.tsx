"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  Menu,
  Rocket,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import {
  fetchRecentOrders,
  fetchTopProducts,
  fetchVendorDashboardSummary,
  fetchVendorRevenueSeries,
  percentDelta,
  type DashboardRecentOrder,
  type DashboardSummary,
  type RevenueGranularity,
  type RevenuePoint,
  type TopProduct,
} from "@/services/vendor-analytics.service";

const statusStyles: Record<string, string> = {
  processing: "bg-surface-container-highest text-foreground",
  shipped: "bg-secondary-container text-on-secondary-container",
  delivered: "bg-tertiary-container text-on-tertiary-container",
  cancelled: "bg-error-container text-on-error-container",
  returned: "bg-error-container text-on-error-container",
};

function formatTaka(amount: number) {
  return `৳${amount.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VendorDashboardPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [granularity, setGranularity] = useState<RevenueGranularity>("daily");
  const [series, setSeries] = useState<RevenuePoint[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardRecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  const vendorId = vendor?.id;

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    fetchVendorRevenueSeries(vendorId, granularity).then((points) => {
      if (active) setSeries(points);
    });
    return () => {
      active = false;
    };
  }, [vendorId, granularity]);

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    Promise.all([fetchVendorDashboardSummary(vendorId), fetchRecentOrders(vendorId), fetchTopProducts(vendorId)]).then(
      ([summaryData, orders, products]) => {
        if (!active) return;
        setSummary(summaryData);
        setRecentOrders(orders);
        setTopProducts(products);
      }
    );
    return () => {
      active = false;
    };
  }, [vendorId]);

  const salesDelta = summary ? percentDelta(summary.revenueThisMonth, summary.revenueLastMonth) : null;
  const ordersDelta = summary ? percentDelta(summary.ordersThisMonth, summary.ordersLastMonth) : null;

  const statCards = summary
    ? [
        {
          label: "Total Sales",
          value: formatTaka(summary.totalSalesAllTime),
          delta: `${salesDelta!.trend === "up" ? "+" : "-"}${salesDelta!.pct.toFixed(1)}%`,
          trend: salesDelta!.trend,
          icon: Wallet,
          iconBg: "bg-primary-container/20",
          iconColor: "text-primary",
        },
        {
          label: "Total Orders",
          value: String(summary.totalOrdersAllTime),
          delta: `${ordersDelta!.trend === "up" ? "+" : "-"}${ordersDelta!.pct.toFixed(1)}%`,
          trend: ordersDelta!.trend,
          icon: ShoppingCart,
          iconBg: "bg-secondary-container/20",
          iconColor: "text-secondary",
        },
        {
          label: "Revenue",
          value: formatTaka(summary.revenueThisMonth),
          delta: `${salesDelta!.trend === "up" ? "+" : "-"}${salesDelta!.pct.toFixed(1)}%`,
          trend: salesDelta!.trend,
          icon: Wallet,
          iconBg: "bg-tertiary-container/20",
          iconColor: "text-tertiary",
        },
        {
          label: "Active Boosted",
          value: String(summary.activeBoostedCount),
          badge: "LIVE",
          icon: Rocket,
          iconBg: "bg-primary-container/20",
          iconColor: "text-primary",
        },
      ]
    : [];

  const visibleRecentOrders = recentOrders.filter((order) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return order.id.toLowerCase().includes(q) || order.customer.toLowerCase().includes(q);
  });

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

      <main className="min-h-screen lg:ml-64">
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
                placeholder="Search analytics, orders…"
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
                  Premium Vendor
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

        <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          {summary && summary.lowStockCount > 0 && (
            <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-error/20 bg-error-container/40 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
                <div>
                  <h4 className="text-sm font-medium text-on-error-container">Low-stock alerts</h4>
                  <p className="text-sm text-on-error-container/80">
                    {summary.lowStockCount} item{summary.lowStockCount === 1 ? "" : "s"} in your inventory are below
                    the reorder point{summary.lowStockNames.length ? `: ${summary.lowStockNames.join(", ")}` : ""}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/vendor/inventory")}
                className="w-full shrink-0 rounded-full bg-error px-4 py-1.5 text-sm font-semibold text-on-error transition-colors hover:bg-error/90 sm:w-auto"
              >
                Manage Inventory
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                    {card.badge ? (
                      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">
                        {card.badge}
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          card.trend === "up" ? "text-primary" : "text-error"
                        }`}
                      >
                        {card.trend === "up" ? (
                          <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown aria-hidden="true" className="h-3.5 w-3.5" />
                        )}
                        {card.delta}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-on-surface-variant">{card.label}</h3>
                  <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/70 p-4 shadow-sm backdrop-blur-md sm:p-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Revenue vs Sales</h2>
                <p className="text-sm text-on-surface-variant">Performance analysis over time</p>
              </div>
              <div className="flex rounded-full bg-surface-container p-1">
                <button
                  type="button"
                  onClick={() => setGranularity("daily")}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    granularity === "daily"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-foreground"
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity("monthly")}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    granularity === "monthly"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="flex h-56 w-full items-end gap-2 overflow-x-auto sm:h-72 lg:h-80 lg:px-4">
              {series.map((bar) => {
                const maxRevenue = Math.max(...series.map((point) => point.revenue), 1);
                const percent = Math.max((bar.revenue / maxRevenue) * 100, 2);
                return (
                  <div
                    key={bar.label}
                    title={`${bar.label}: ৳${bar.revenue.toLocaleString("en-BD")} (${bar.orders} order${bar.orders === 1 ? "" : "s"})`}
                    className="group relative min-w-7 flex-1 rounded-t-lg bg-primary transition-all"
                    style={{ height: `${percent}%`, opacity: 0.25 + (percent / 100) * 0.75 }}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {series.map((bar) => (
                <span key={bar.label}>{bar.label}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/30 bg-white/70 shadow-sm backdrop-blur-md lg:col-span-3">
              <div className="flex items-center justify-between border-b border-outline-variant p-6">
                <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
                <button
                  onClick={() => router.push("/vendor/orders")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="whitespace-nowrap px-6 py-4">Order ID</th>
                      <th className="whitespace-nowrap px-6 py-4">Customer</th>
                      <th className="whitespace-nowrap px-6 py-4">Date</th>
                      <th className="whitespace-nowrap px-6 py-4">Total</th>
                      <th className="whitespace-nowrap px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-sm">
                    {visibleRecentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-primary">#{order.id}</td>
                        <td className="whitespace-nowrap px-6 py-4">{order.customer}</td>
                        <td className="whitespace-nowrap px-6 py-4">{formatOrderDate(order.date)}</td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium">{formatTaka(order.total)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[order.status] ?? ""}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {visibleRecentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/30 bg-white/70 shadow-sm backdrop-blur-md lg:col-span-2">
              <div className="border-b border-outline-variant p-6">
                <h2 className="text-lg font-semibold text-foreground">Top Performing Products</h2>
              </div>
              <div className="space-y-6 p-6">
                {topProducts.map((product) => (
                  <div key={product.id} className="group flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high text-2xl">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-foreground">{product.name}</h4>
                      <div className="mt-1 flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">Units Sold</span>
                          <span className="text-sm font-semibold text-primary">{product.unitsSold}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">Revenue</span>
                          <span className="text-sm font-semibold text-secondary">{formatTaka(product.revenue)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary">
                      <ChevronRight aria-hidden="true" className="h-5 w-5" />
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-center text-sm text-on-surface-variant">No sales yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:p-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary">EcoMart Admin</span>
            <span className="text-sm text-on-surface-variant">© {new Date().getFullYear()} EcoMart Vendor Solutions</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
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
        </footer>
      </main>
    </div>
  );
}
