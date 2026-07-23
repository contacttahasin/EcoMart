"use client";

import { Gift, Heart, MapPin, Package, ShoppingBag, Star, Ticket, UserCog, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { AccountBottomNav } from "@/app/components/account/AccountBottomNav";
import { AccountSidebar } from "@/app/components/account/AccountSidebar";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { orders } from "@/data/orders";
import { formatOrderDate, STATUS_BADGE } from "@/services/order.service";

const QUICK_LINKS = [
  { icon: Package, title: "My Orders", description: "Track, return, or buy items again", href: "/account/orders" },
  { icon: Gift, title: "Coupons & Rewards", description: "View your active promo codes & discounts", href: "#" },
  { icon: Heart, title: "Wishlist", description: "Your saved favorite items", href: "/account/wishlist" },
  { icon: MapPin, title: "Saved Addresses", description: "Manage delivery locations", href: "/account/addresses" },
  {
    icon: UserCog,
    title: "Account Settings",
    description: "Update password & personal info",
    href: "/account/settings",
    wide: true,
  },
];

export default function AccountDashboardPage() {
  const { user: customer, isLoading } = useAuthGuard();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading || !customer) return null;

  const customerOrders = orders
    .filter((order) => order.customerId === customer.id)
    .sort((a, b) => new Date(b.placedOn).getTime() - new Date(a.placedOn).getTime());
  const recentOrders = customerOrders.slice(0, 2);

  const metrics = [
    { icon: Wallet, label: "Total Spent", value: "৳12,500" },
    { icon: ShoppingBag, label: "Total Orders", value: `${customerOrders.length} Orders` },
    { icon: Ticket, label: "Available Coupons", value: "2 Vouchers" },
    { icon: Star, label: "Reward Points", value: "350 Points" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <AccountSidebar customer={customer} />

        <main className="w-full py-12 pb-24 md:ml-64 md:pb-12">
          <div className="mx-auto max-w-4xl space-y-6">
            <section className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] sm:flex-row">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary-container text-2xl font-semibold text-primary shadow-sm">
                  {customer.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={customer.avatar} alt={customer.name} className="h-full w-full object-cover" />
                  ) : (
                    customer.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                  <p className="text-on-surface-variant">{customer.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border-2 border-error px-6 py-2 text-sm font-medium text-error transition-all hover:bg-error hover:text-white active:scale-95"
              >
                Log Out
              </button>
            </section>

            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] transition-colors hover:border-primary"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-xl bg-primary-container/20 p-2 text-primary">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-on-surface-variant">{label}</h4>
                  <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {QUICK_LINKS.map(({ icon: Icon, title, description, href, wide }) => (
                <Link
                  key={title}
                  href={href}
                  className={`group rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] transition-all hover:bg-surface-container-low ${
                    wide ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Icon aria-hidden="true" className="h-7 w-7 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                        {title}
                      </h3>
                      <p className="text-sm text-on-surface-variant">{description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
                <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {recentOrders.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-10 text-center text-sm text-on-surface-variant">
                    No orders yet.
                  </p>
                )}
                {recentOrders.map((order) => {
                  const badge = STATUS_BADGE[order.status];
                  const BadgeIcon = badge.icon;

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] sm:flex-row"
                    >
                      <div className="flex w-full items-center gap-4 sm:w-auto">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-container">
                          <Package aria-hidden="true" className="h-6 w-6 text-on-surface-variant" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{order.productName}</h4>
                          <p className="text-sm text-on-surface-variant">
                            Order #{order.orderNumber} • {formatOrderDate(order.placedOn)}
                          </p>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-6 sm:w-auto sm:justify-end">
                        <span
                          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ${badge.className}`}
                        >
                          <BadgeIcon aria-hidden="true" className="h-3.5 w-3.5" />
                          {badge.label}
                        </span>
                        <Link
                          href="/account/orders"
                          className="rounded-lg px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>

      <AccountBottomNav />
    </div>
  );
}
