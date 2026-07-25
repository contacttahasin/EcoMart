"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
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

const statCards = [
  {
    label: "Total Sales",
    value: "৳1,24,500",
    delta: "+12.5%",
    trend: "up" as const,
    icon: Wallet,
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary",
  },
  {
    label: "Total Orders",
    value: "342",
    delta: "+8.2%",
    trend: "up" as const,
    icon: ShoppingCart,
    iconBg: "bg-secondary-container/20",
    iconColor: "text-secondary",
  },
  {
    label: "Revenue",
    value: "৳85,000",
    delta: "-2.4%",
    trend: "down" as const,
    icon: Wallet,
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary",
  },
  {
    label: "Active Boosted",
    value: "12",
    badge: "LIVE",
    icon: Rocket,
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary",
  },
];

const chartData = [
  { day: "Mon", height: "h-3/4", shade: "bg-primary/10" },
  { day: "Tue", height: "h-2/3", shade: "bg-primary/20" },
  { day: "Wed", height: "h-full", shade: "bg-primary/30" },
  { day: "Thu", height: "h-4/5", shade: "bg-primary/40" },
  { day: "Fri", height: "h-3/5", shade: "bg-primary/50" },
  { day: "Sat", height: "h-1/2", shade: "bg-primary/70" },
  { day: "Sun", height: "h-full", shade: "bg-primary" },
];

const recentOrders = [
  { id: "#EM-9021", customer: "Tanvir Ahmed", date: "Oct 24, 2024", total: "৳2,450", status: "Shipped" as const },
  { id: "#EM-9022", customer: "Sanjida Khan", date: "Oct 24, 2024", total: "৳1,120", status: "Pending" as const },
  { id: "#EM-9023", customer: "Rafiq Islam", date: "Oct 23, 2024", total: "৳5,800", status: "Delivered" as const },
  { id: "#EM-9024", customer: "Musa Ibrahim", date: "Oct 23, 2024", total: "৳950", status: "Cancelled" as const },
];

const statusStyles: Record<(typeof recentOrders)[number]["status"], string> = {
  Shipped: "bg-secondary-container text-on-secondary-container",
  Pending: "bg-surface-container-highest text-foreground",
  Delivered: "bg-tertiary-container text-on-tertiary-container",
  Cancelled: "bg-error-container text-on-error-container",
};

const topProducts = [
  { name: "Eco Bamboo Cup", ctr: "12.4%", conv: "4.2%", emoji: "🥤" },
  { name: "Organic Cotton Tote", ctr: "9.8%", conv: "3.7%", emoji: "👜" },
  { name: "Beeswax Food Wraps", ctr: "8.1%", conv: "2.9%", emoji: "🌿" },
];

export default function VendorDashboardPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                placeholder="Search analytics, orders…"
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
                  Premium Vendor
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-error/20 bg-error-container/40 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
              <div>
                <h4 className="text-sm font-medium text-on-error-container">Low-stock alerts</h4>
                <p className="text-sm text-on-error-container/80">
                  3 items in your inventory are below the reorder point: Organic Jute Bags, Bamboo Straws (10pk).
                </p>
              </div>
            </div>
            <button className="w-full flex-shrink-0 rounded-full bg-error px-4 py-1.5 text-sm font-semibold text-on-error transition-colors hover:bg-error/90 sm:w-auto">
              Manage Inventory
            </button>
          </div>

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
                <button className="rounded-full bg-surface-container-lowest px-4 py-1.5 text-sm font-semibold text-primary shadow-sm transition-all">
                  Daily
                </button>
                <button className="rounded-full px-4 py-1.5 text-sm font-semibold text-on-surface-variant transition-all hover:text-foreground">
                  Monthly
                </button>
              </div>
            </div>
            <div className="flex h-56 w-full items-end gap-2 overflow-x-auto sm:h-72 lg:h-80 lg:px-4">
              {chartData.map((bar) => (
                <div key={bar.day} className={`group relative min-w-[28px] flex-1 ${bar.height} ${bar.shade} rounded-t-lg transition-all`} />
              ))}
            </div>
            <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {chartData.map((bar) => (
                <span key={bar.day}>{bar.day}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/30 bg-white/70 shadow-sm backdrop-blur-md lg:col-span-3">
              <div className="flex items-center justify-between border-b border-outline-variant p-6">
                <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
                <button className="text-sm font-semibold text-primary hover:underline">View All</button>
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
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-primary">{order.id}</td>
                        <td className="whitespace-nowrap px-6 py-4">{order.customer}</td>
                        <td className="whitespace-nowrap px-6 py-4">{order.date}</td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium">{order.total}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
                  <div key={product.name} className="group flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-2xl">
                      {product.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-foreground">{product.name}</h4>
                      <div className="mt-1 flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">CTR</span>
                          <span className="text-sm font-semibold text-primary">{product.ctr}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">Conv. Rate</span>
                          <span className="text-sm font-semibold text-secondary">{product.conv}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary">
                      <ChevronRight aria-hidden="true" className="h-5 w-5" />
                    </div>
                  </div>
                ))}
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
