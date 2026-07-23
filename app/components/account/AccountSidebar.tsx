"use client";

import { Heart, HelpCircle, LayoutDashboard, LogOut, MapPin, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { Customer } from "@/data/customers";

const NAV_LINKS = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Settings", href: "/account/settings", icon: Settings },
];

type AccountSidebarProps = {
  customer: Customer;
};

export function AccountSidebar({ customer }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside className="fixed top-16 left-0 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-surface-container bg-surface-container-lowest p-6 md:flex">
      <div className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-secondary-container bg-secondary-container text-2xl font-semibold text-primary">
          {customer.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customer.avatar} alt={customer.name} className="h-full w-full object-cover" />
          ) : (
            customer.name.charAt(0).toUpperCase()
          )}
        </div>
        <h3 className="text-lg font-semibold text-primary">{customer.name}</h3>
        <p className="text-sm text-on-surface-variant">Premium Member</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = link.href !== "#" && pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
                isActive
                  ? "bg-secondary-container/20 font-bold text-primary"
                  : "text-on-surface-variant hover:bg-secondary-container/10"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-surface-container pt-4">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-on-surface-variant hover:bg-secondary-container/10"
        >
          <HelpCircle aria-hidden="true" className="h-5 w-5" />
          <span>Help Center</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-error transition-colors hover:bg-error/5"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
