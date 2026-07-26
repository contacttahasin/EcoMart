"use client";

import { Share2, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { getEffectivePrice, getProductsByIds, getStockStatus } from "@/services/product.service";

type WishlistPageClientProps = {
  recommended: Product[];
};

const STOCK_BADGE = {
  "in-stock": { label: "In Stock", className: "bg-secondary-container text-on-secondary-container" },
  "low-stock": { label: "Low Stock", className: "bg-surface-container-highest text-on-surface-variant" },
  "out-of-stock": { label: "Out of Stock", className: "bg-surface-container-highest text-on-surface-variant" },
} as const;

export function WishlistPageClient({ recommended }: WishlistPageClientProps) {
  const { productIds, toggle } = useWishlist();
  const [items, setItems] = useState<Product[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const { addItem } = useCart();

  useEffect(() => {
    let active = true;
    getProductsByIds([...productIds]).then((fetched) => {
      if (active) setItems(fetched);
    });
    return () => {
      active = false;
    };
  }, [productIds]);

  const handleRemove = (product: Product) => {
    setRemovingIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== product.id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      toggle(product);
    }, 300);
  };

  const handleAddAllToCart = () => {
    items.forEach((product) => addItem(product, 1));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Wishlist</h1>
          <p className="text-on-surface-variant">
            You have {items.length} item{items.length === 1 ? "" : "s"} saved for later.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-surface-container-highest px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-surface-variant"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            Share List
          </button>
          <button
            type="button"
            onClick={handleAddAllToCart}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart aria-hidden="true" className="h-4 w-4" />
            Add All to Cart
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
          <p className="text-on-surface-variant">Your wishlist is empty. Save items you love to find them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {items.map((product) => {
            const isRemoving = removingIds.has(product.id);
            const stockStatus = getStockStatus(product);
            const badge = STOCK_BADGE[stockStatus];
            const effectivePrice = getEffectivePrice(product);
            const outOfStock = stockStatus === "out-of-stock";

            return (
              <div
                key={product.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-surface-container-lowest shadow-[0px_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-outline-variant hover:shadow-[0px_8px_24px_rgba(0,0,0,0.08)] ${
                  isRemoving ? "scale-95 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <div className="relative h-64 w-full overflow-hidden bg-surface">
                  <Link href={`/product/${product.slug}`} className="absolute inset-0">
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="280px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove ${product.title} from wishlist`}
                    onClick={() => handleRemove(product)}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-error shadow-sm backdrop-blur-sm transition-colors hover:bg-error-container"
                  >
                    <Trash2 aria-hidden="true" className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/product/${product.slug}`} className="mb-1 text-lg font-semibold text-foreground">
                    {product.title}
                  </Link>
                  <p className="mb-4 text-lg font-bold text-primary">${effectivePrice.toFixed(2)}</p>
                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addItem(product, 1)}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-white transition-all hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-outline-variant"
                  >
                    <ShoppingCart aria-hidden="true" className="h-4 w-4" />
                    {outOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recommended.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">You might also like</h2>
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {recommended.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="flex min-w-[220px] items-center gap-3 rounded-xl border border-outline-variant bg-white p-3 shadow-sm"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={product.images[0]} alt={product.title} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
                  <p className="text-sm font-bold text-primary">${getEffectivePrice(product).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
