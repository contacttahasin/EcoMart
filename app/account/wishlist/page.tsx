"use client";

import Navbar from "@/app/components/Navbar";
import { AccountBottomNav } from "@/app/components/account/AccountBottomNav";
import { AccountSidebar } from "@/app/components/account/AccountSidebar";
import { WishlistPageClient } from "@/app/components/account/WishlistPageClient";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { products } from "@/data/products";

export default function WishlistPage() {
  const { user: customer, isLoading } = useAuthGuard();

  if (isLoading || !customer) return null;

  const wishlistItems = customer.wishlist
    .map((productId) => products.find((product) => product.id === productId && product.status === "active"))
    .filter((product) => product !== undefined);

  const recommended = products
    .filter((product) => product.status === "active" && !customer.wishlist.includes(product.id))
    .sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.rating - a.rating)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <AccountSidebar customer={customer} />

        <main className="w-full py-12 pb-24 md:ml-64 md:pb-12">
          <WishlistPageClient initialItems={wishlistItems} recommended={recommended} />
        </main>
      </div>

      <AccountBottomNav />
    </div>
  );
}
