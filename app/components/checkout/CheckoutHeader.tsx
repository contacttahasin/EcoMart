import Link from "next/link";
import { ArrowLeft, Leaf, Lock } from "lucide-react";

export function CheckoutHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface shadow-[0px_12px_32px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Leaf aria-hidden="true" className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary sm:text-2xl">EcoMarket</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-1.5 text-sm font-medium text-on-surface-variant md:flex">
            <Lock aria-hidden="true" className="h-4 w-4" />
            Secure Checkout
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    </header>
  );
}
