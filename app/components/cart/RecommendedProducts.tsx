"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { products } from "@/data/products";
import { getEffectivePrice } from "@/services/product.service";

type RecommendedProductsProps = {
  excludeIds: string[];
};

export function RecommendedProducts({ excludeIds }: RecommendedProductsProps) {
  const recommended = useMemo(() => {
    const excluded = new Set(excludeIds);
    return products.filter((product) => product.status === "active" && !excluded.has(product.id)).slice(0, 3);
  }, [excludeIds]);

  if (recommended.length === 0) return null;

  return (
    <div className="mt-4 border-t border-outline-variant pt-6">
      <h2 className="text-lg font-bold text-foreground">You might also like</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {recommended.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-colors duration-300 ease-out hover:bg-surface"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Image src={product.images[0]} alt={product.title} fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
              <p className="text-sm font-semibold text-primary">${getEffectivePrice(product).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
