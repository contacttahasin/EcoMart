"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CartItem } from "@/app/context/CartContext";
import { useCart } from "@/app/context/CartContext";
import { getEffectivePrice } from "@/services/product.service";

const TAX_RATE = 0.08;

type OrderReviewProps = {
  items: CartItem[];
  shippingCost: number;
};

export function OrderReview({ items, shippingCost }: OrderReviewProps) {
  const { clearCart } = useCart();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");

  const subtotal = items.reduce((sum, item) => sum + getEffectivePrice(item.product) * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  const handlePlaceOrder = () => {
    clearCart();
    router.push("/");
  };

  return (
    <aside className="sticky top-24 rounded-xl border border-outline-variant bg-white p-4 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <h2 className="mb-4 text-xl font-bold text-foreground">Order Review</h2>

      <div className="mb-6 max-h-64 space-y-4 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Image src={item.product.images[0]} alt={item.product.title} fill sizes="64px" className="object-cover" />
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-medium text-foreground">{item.product.title}</h4>
              <p className="text-sm text-on-surface-variant">Qty: {item.quantity}</p>
              <p className="mt-1 text-sm font-semibold text-primary">
                ${getEffectivePrice(item.product).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-3 border-t border-outline-variant pt-4">
        <div className="flex justify-between text-on-surface-variant">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-outline-variant pt-3 text-xl font-bold text-foreground">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={promoCode}
          onChange={(event) => setPromoCode(event.target.value)}
          placeholder="Promo Code"
          className="flex-grow rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/40"
        />
        <button
          type="button"
          className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary-container/10"
        >
          Apply
        </button>
      </div>

      <button
        type="button"
        onClick={handlePlaceOrder}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-on-surface-variant active:scale-95"
      >
        Place Order
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>

      <p className="mt-4 text-center text-sm text-on-surface-variant">
        By placing your order, you agree to EcoMarket&apos;s{" "}
        <a href="#" className="underline">
          Terms of Service
        </a>
        .
      </p>
    </aside>
  );
}
