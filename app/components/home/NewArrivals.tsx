"use client";

import { useMemo, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, products, type Product } from "@/data/products";
import { useCart } from "@/app/context/CartContext";

const FILTERS = ["All", ...CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden">
        <Link
          href={`/product/${product.slug}`}
          aria-label={`View ${product.title}`}
          className="absolute inset-0"
        >
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </Link>

        <button
          type="button"
          aria-label={`Add ${product.title} to wishlist`}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-on-surface-variant shadow-md transition-transform duration-300 ease-out hover:text-primary group-hover:scale-110"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          {product.category}
        </span>

        <Link
          href={`/product/${product.slug}`}
          className="truncate text-base font-semibold text-foreground"
        >
          {product.title}
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>

          <button
            type="button"
            onClick={() => addItem(product, 1)}
            aria-label={`Add ${product.title} to cart`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors duration-300 ease-out hover:bg-on-surface-variant"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewArrivals() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const newArrivals = useMemo(
    () => products.filter((product) => product.status === "active" && product.newArrival),
    []
  );

  const visibleProducts = useMemo(
    () =>
      activeFilter === "All"
        ? newArrivals
        : newArrivals.filter((product) => product.category === activeFilter),
    [newArrivals, activeFilter]
  );

  return (
    <section aria-labelledby="new-arrivals-heading" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 id="new-arrivals-heading" className="text-3xl font-bold text-primary sm:text-4xl">
            New Arrivals
          </h2>

          <div role="group" aria-label="Filter by category" className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(filter)}
                  className={
                    isActive
                      ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 ease-out"
                      : "rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors duration-300 ease-out hover:text-primary"
                  }
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
            <p className="text-base font-medium text-on-surface-variant">
              No products found in this category yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
