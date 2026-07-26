"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Leaf,
  LogOut,
  Megaphone,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/vendor/dashboard" },
  { label: "Products", icon: ShoppingBag, href: "/vendor/products/new" },
  { label: "Promotions", icon: Megaphone, href: "/vendor/promotions" },
  { label: "Inventory", icon: Package, href: "/vendor/inventory" },
  { label: "Orders", icon: Receipt, href: "/vendor/orders" },
  { label: "Payouts", icon: Wallet, href: "/vendor/payouts" },
  { label: "Customers", icon: Users, href: "/vendor/customers" },
  { label: "Settings", icon: Settings, href: "/vendor/settings" },
];

type VendorSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function VendorSidebar({ isOpen, onClose }: VendorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useVendorAuth();

  const handleLogout = () => {
    logout();
    router.push("/vendor/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-auto bg-surface-container-lowest px-4 py-6 shadow-sm transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Leaf aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">EcoMart</h1>
              <p className="text-xs font-medium text-on-surface-variant">Vendor Admin</p>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="text-on-surface-variant lg:hidden"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href !== "#" && pathname?.startsWith(item.href);

            return isActive ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-l-lg border-r-4 border-primary bg-secondary-container/20 px-3 py-3 font-bold text-primary transition-colors"
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-3 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-on-surface-variant transition-colors hover:bg-error-container/10 hover:text-error"
          >
            <LogOut aria-hidden="true" className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
