"use client";

import { Heart, Home, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Profile", href: "/account", icon: User },
];

export function AccountBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-surface px-4 py-2 shadow-[0px_-4px_12px_rgba(0,0,0,0.04)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = item.href !== "/" && pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-on-surface-variant ${
              active ? "rounded-xl bg-secondary-container text-on-secondary-container" : ""
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
