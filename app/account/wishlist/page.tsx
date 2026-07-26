"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { AccountBottomNav } from "@/app/components/account/AccountBottomNav";
import { AccountSidebar } from "@/app/components/account/AccountSidebar";
import { WishlistPageClient } from "@/app/components/account/WishlistPageClient";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useWishlist } from "@/app/context/WishlistContext";
import { getProducts } from "@/services/product.service";
import type { Product } from "@/data/products";

export default function WishlistPage() {
  const { user: customer, isLoading } = useAuthGuard();
  const { productIds } = useWishlist();
  const [recommended, setRecommended] = useState<Product[]>([]);

  useEffect(() => {
    getProducts({ sort: "best-selling", limit: 50 }).then(({ products }) => {
      setRecommended(products.filter((product) => !productIds.has(product.id)).slice(0, 6));
    });
  }, [productIds]);

  if (isLoading || !customer) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <AccountSidebar customer={customer} />

        <main className="w-full min-w-0 py-12 pb-24 md:ml-64 md:pb-12">
          <WishlistPageClient recommended={recommended} />
        </main>
      </div>

      <AccountBottomNav />
    </div>
  );
}
