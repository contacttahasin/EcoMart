"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "@/app/context/AuthContext";
import { addToWishlist, fetchWishlistProductIds, removeFromWishlist } from "@/services/wishlist.service";

type WishlistContextValue = {
  productIds: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggle: (product: Product) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    (async () => {
      if (!user) {
        setProductIds(new Set());
        return;
      }
      const ids = await fetchWishlistProductIds(user.id);
      if (active) setProductIds(new Set(ids));
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const isWishlisted = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const toggle = useCallback(
    (product: Product) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const wishlisted = productIds.has(product.id);
      setProductIds((prev) => {
        const next = new Set(prev);
        if (wishlisted) next.delete(product.id);
        else next.add(product.id);
        return next;
      });

      if (wishlisted) void removeFromWishlist(user.id, product.id);
      else void addToWishlist(user.id, product.id);
    },
    [user, productIds, router]
  );

  const value = useMemo(() => ({ productIds, isWishlisted, toggle }), [productIds, isWishlisted, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
