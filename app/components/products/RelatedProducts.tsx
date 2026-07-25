"use client";

import type { Product } from "@/data/products";
import { useQuickView } from "@/app/hooks/useQuickView";
import { ProductCard } from "./ProductCard";
import { QuickViewModal } from "./QuickViewModal";

type RelatedProductsProps = {
  products: Product[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  const quickView = useQuickView();

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-products-heading" className="w-full">
      <h2 id="related-products-heading" className="text-2xl font-bold text-primary sm:text-3xl">
        You Might Also Like
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={quickView.open} />
        ))}
      </div>

      <QuickViewModal product={quickView.product} onClose={quickView.close} />
    </section>
  );
}
