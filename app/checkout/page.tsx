"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CheckoutHeader } from "@/app/components/checkout/CheckoutHeader";
import { CheckoutFooter } from "@/app/components/checkout/CheckoutFooter";
import { ShippingForm } from "@/app/components/checkout/ShippingForm";
import { DeliveryMethod, type DeliveryOption } from "@/app/components/checkout/DeliveryMethod";
import { PaymentMethod } from "@/app/components/checkout/PaymentMethod";
import { TrustBadges } from "@/app/components/checkout/TrustBadges";
import { OrderReview } from "@/app/components/checkout/OrderReview";
import { useCart } from "@/app/context/CartContext";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import type { PaymentMethodOption, ShippingInfo } from "@/services/order.service";

const SHIPPING_COST: Record<DeliveryOption, number> = {
  standard: 5,
  eco: 0,
};

const EMPTY_SHIPPING: ShippingInfo = { fullName: "", email: "", phone: "", street: "", city: "", state: "", zipCode: "" };

function StepNumber({ step }: { step: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {step}
    </span>
  );
}

function EmptyCheckout() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-20 text-center">
      <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
        <ShoppingCart className="h-8 w-8 text-primary" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">Your cart is empty</p>
        <p className="mt-1 text-sm text-on-surface-variant">Add something to your cart before checking out.</p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-out hover:bg-on-surface-variant"
      >
        Start Shopping
      </Link>
    </div>
  );
}

export default function CheckoutPage() {
  const { items } = useCart();
  const { user: customer, isLoading } = useAuthGuard();
  const [delivery, setDelivery] = useState<DeliveryOption>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>("card");
  const [shipping, setShipping] = useState<ShippingInfo>(EMPTY_SHIPPING);

  if (isLoading || !customer) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CheckoutHeader />
      <main className="mx-auto w-full max-w-7xl grow px-4 py-8 sm:px-6 lg:py-12">
        {items.length === 0 ? (
          <EmptyCheckout />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-8 lg:col-span-7">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <StepNumber step={1} />
                  <h2 className="text-xl font-bold text-foreground">Shipping Information</h2>
                </div>
                <ShippingForm value={shipping} onChange={setShipping} />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <StepNumber step={2} />
                  <h2 className="text-xl font-bold text-foreground">Delivery Method</h2>
                </div>
                <DeliveryMethod selected={delivery} onSelect={setDelivery} />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <StepNumber step={3} />
                  <h2 className="text-xl font-bold text-foreground">Payment Method</h2>
                </div>
                <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />
              </section>

              <TrustBadges />
            </div>

            <div className="lg:col-span-5">
              <OrderReview
                items={items}
                shippingCost={SHIPPING_COST[delivery]}
                customerId={customer.id}
                shipping={shipping}
                delivery={delivery}
                paymentMethod={paymentMethod}
              />
            </div>
          </div>
        )}
      </main>
      <CheckoutFooter />
    </div>
  );
}
