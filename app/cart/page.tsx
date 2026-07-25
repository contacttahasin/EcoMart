"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { CartItemRow } from "@/app/components/cart/CartItemRow";
import { OrderSummary } from "@/app/components/cart/OrderSummary";
import { RecommendedProducts } from "@/app/components/cart/RecommendedProducts";
import { useCart } from "@/app/context/CartContext";
import Footer from "@/app/components/layout/Footer";

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-20 text-center">
      <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
        <ShoppingCart className="h-8 w-8 text-primary" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">Your cart is empty</p>
        <p className="mt-1 text-sm text-on-surface-variant">Find something you love and add it to your cart.</p>
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

export default function CartPage() {
  const { items } = useCart();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Your Shopping Cart</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Review your selection of conscious choices for a better planet.
          </p>
        </header>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-4">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))}

              <RecommendedProducts excludeIds={items.map((item) => item.product.id)} />
            </div>

            <div className="w-full lg:w-[400px] lg:shrink-0">
              <OrderSummary />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
