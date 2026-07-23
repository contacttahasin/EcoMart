"use client";

import { ArrowRight, ChevronDown, ChevronUp, Headset, Lock, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING_COST = 6.99;

const TRUST_BADGES = [
  { icon: Lock, label: "Secure Payment" },
  { icon: Truck, label: "Carbon-Neutral Delivery" },
  { icon: RefreshCw, label: "30-Day Returns" },
  { icon: Headset, label: "24/7 Eco Support" },
];

export function OrderSummary() {
  const { subtotal } = useCart();
  const [promoOpen, setPromoOpen] = useState(false);

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-bold text-foreground">Order Summary</h2>

        <div className="mt-4 space-y-3 border-b border-outline-variant pb-4">
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Shipping</span>
            <span className={shipping === 0 ? "font-semibold text-primary" : undefined}>
              {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Estimated Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="py-4">
          <div className="flex items-center justify-between text-2xl font-bold text-foreground">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs italic text-on-surface-variant">
            Or 4 interest-free payments of ${(total / 4).toFixed(2)}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Proceed to Checkout
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-full border border-outline-variant bg-white py-3 text-sm font-semibold text-foreground transition-colors duration-300 ease-out hover:bg-surface"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-outline-variant pt-4">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-on-surface-variant">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-md">
        <button
          type="button"
          aria-expanded={promoOpen}
          aria-controls="promo-content"
          onClick={() => setPromoOpen((open) => !open)}
          className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
        >
          Have a promo code?
          {promoOpen ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
        {promoOpen && (
          <div id="promo-content" className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="ECO2024"
              aria-label="Promo code"
              className="flex-1 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-secondary-container"
            />
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-on-surface-variant"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
