import { Bell, Settings, UserCircle } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = ["Dashboard", "Help Center", "Contact Support"];

export function MerchantPortalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface shadow-[0px_12px_32px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-bold text-primary">
            EcoMarket
          </Link>
          <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
            Merchant Portal
          </span>
        </div>

        <nav aria-label="Merchant" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((label) => (
            <a
              key={label}
              href="#"
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="text-on-surface-variant transition-colors hover:text-primary active:opacity-80"
          >
            <Bell aria-hidden="true" className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="text-on-surface-variant transition-colors hover:text-primary active:opacity-80"
          >
            <Settings aria-hidden="true" className="h-6 w-6" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-secondary-container text-primary">
            <UserCircle aria-hidden="true" className="h-6 w-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
