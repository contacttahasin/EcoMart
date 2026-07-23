"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, ShoppingCart, UserCircle, X } from "lucide-react";
import { AccountTypeModal } from "@/app/components/account/AccountTypeModal";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";

const navLinks = [
  { label: "Shop", href: "/" },
  { label: "Organic", href: "/organic" },
  { label: "Electronics", href: "/electronics" },
  { label: "Groceries", href: "/groceries" },
  { label: "Deals", href: "/deals" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-surface shadow-[0px_12px_32px_rgba(0,0,0,0.12)]"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-xl font-bold leading-none tracking-[-0.01em] text-primary sm:text-2xl sm:leading-tight md:text-[32px] md:leading-10"
          >
            EcoMarket
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 text-base md:flex">
            {navLinks.map((link) => {
              const isActive = link.href !== "#" && pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "border-b-2 border-primary pb-1 font-semibold text-primary"
                      : "text-on-surface-variant transition-colors hover:text-primary"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              aria-label="Search marketplace"
              placeholder="Search marketplace..."
              className="w-64 rounded-full border border-outline-variant py-2 pl-10 pr-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/cart"
              aria-label={itemCount > 0 ? `Shopping cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Shopping cart"}
              className="relative p-1.5 text-on-surface-variant transition-transform hover:text-primary active:scale-90 sm:p-2"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              className="p-1.5 text-on-surface-variant transition-transform hover:text-primary active:scale-90 sm:p-2"
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            {user ? (
              <Link
                href="/account"
                aria-label="Account"
                className="p-1.5 text-on-surface-variant transition-transform hover:text-primary active:scale-90 sm:p-2"
              >
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-5 w-5 rounded-full object-cover sm:h-6 sm:w-6"
                  />
                ) : (
                  <UserCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </Link>
            ) : (
              <button
                type="button"
                aria-label="Account"
                onClick={() => setAccountModalOpen(true)}
                className="p-1.5 text-on-surface-variant transition-transform hover:text-primary active:scale-90 sm:p-2"
              >
                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="p-1.5 text-on-surface-variant transition-transform hover:text-primary active:scale-90 sm:p-2 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="w-full border-t border-outline-variant bg-surface px-6 py-4 md:hidden"
        >
          <div className="relative mb-4">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              aria-label="Search marketplace"
              placeholder="Search marketplace..."
              className="w-full rounded-full border border-outline-variant py-2 pl-10 pr-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container"
            />
          </div>

          <nav aria-label="Main" className="flex flex-col gap-4 text-base">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={link.href !== "#" && pathname === link.href ? "page" : undefined}
                className={
                  link.href !== "#" && pathname === link.href
                    ? "font-semibold text-primary"
                    : "text-on-surface-variant transition-colors hover:text-primary"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
    <AccountTypeModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
    </>
  );
}
