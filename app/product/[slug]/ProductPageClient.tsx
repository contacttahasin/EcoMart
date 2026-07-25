"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { notFound } from "next/navigation";
import { useState } from "react";
import Footer from "@/app/components/layout/Footer";
import Navbar from "@/app/components/Navbar";
import { ProductActions } from "@/app/components/products/ProductActions";
import { ProductBreadcrumb } from "@/app/components/products/ProductBreadcrumb";
import { ProductGallery } from "@/app/components/products/ProductGallery";
import { ProductInfo } from "@/app/components/products/ProductInfo";
import { ProductTabs } from "@/app/components/products/ProductTabs";
import { ProductVariants } from "@/app/components/products/ProductVariants";
import { RelatedProducts } from "@/app/components/products/RelatedProducts";
import { VendorCard } from "@/app/components/products/VendorCard";
import { useCart } from "@/app/context/CartContext";
import { useProduct } from "@/app/hooks/useProduct";
import { getEffectivePrice } from "@/services/product.service";

type ProductPageClientProps = {
  slug: string;
};

function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2"
      aria-hidden="true"
    >
      <div className="aspect-square animate-pulse rounded-2xl bg-surface" />
      <div className="flex flex-col gap-4">
        <div className="h-6 w-1/3 animate-pulse rounded-full bg-surface" />
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-surface" />
        <div className="h-5 w-1/4 animate-pulse rounded-full bg-surface" />
        <div className="h-10 w-1/3 animate-pulse rounded-full bg-surface" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-surface" />
        <div className="h-12 w-full animate-pulse rounded-full bg-surface" />
      </div>
    </div>
  );
}

export function ProductPageClient({ slug }: ProductPageClientProps) {
  const { product, relatedProducts, isLoading, notFound: productNotFound } = useProduct(slug);
  const { items, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  if (productNotFound) {
    notFound();
  }

  if (isLoading || !product) {
    return (
      <>
        <Navbar />
        <main className="w-full bg-surface py-8">
          <ProductDetailSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const variantDelta = Object.entries(selectedVariants).reduce((sum, [groupName, value]) => {
    const group = product.variants?.find((candidate) => candidate.name === groupName);
    const option = group?.options.find((candidate) => candidate.value === value);
    return sum + (option?.priceDelta ?? 0);
  }, 0);
  const totalPrice = (effectivePrice + variantDelta) * quantity;
  const outOfStock = product.stock <= 0;
  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const isInCart = items.some((item) => item.product.id === product.id);

  return (
    <>
      <Navbar />
      <main className="w-full bg-surface pb-28 lg:pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <ProductBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: product.category, href: "/organic" },
              { label: product.subcategory },
              { label: product.title },
            ]}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-start"
        >
          <ProductGallery images={product.images} title={product.title} video={product.video} />

          <div className="flex flex-col gap-6 lg:sticky lg:top-[100px]">
            <ProductInfo product={product} />

            {product.variants && product.variants.length > 0 && (
              <ProductVariants
                variants={product.variants}
                selected={selectedVariants}
                onSelect={(groupName, value) =>
                  setSelectedVariants((prev) => ({ ...prev, [groupName]: value }))
                }
              />
            )}

            <ProductActions
              product={product}
              stock={product.stock}
              quantity={quantity}
              onQuantityChange={setQuantity}
              productTitle={product.title}
              productUrl={productUrl}
            />

            <VendorCard vendor={product.vendorProfile} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
          className="mx-auto mt-12 w-full max-w-7xl px-4 sm:px-6"
        >
          <ProductTabs product={product} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
          className="mx-auto mt-12 w-full max-w-7xl px-4 sm:px-6"
        >
          <RelatedProducts products={relatedProducts} />
        </motion.div>
      </main>

      {/* Sticky mobile Add to Cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-outline-variant bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant">Total</span>
          <span className="text-lg font-bold text-foreground">${totalPrice.toFixed(2)}</span>
        </div>
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => addItem(product, quantity)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 ease-out active:scale-95 disabled:bg-outline-variant disabled:text-on-surface-variant"
        >
          <ShoppingCart aria-hidden="true" className="h-4 w-4" />
          {outOfStock ? "Out of Stock" : isInCart ? "Added to Cart" : "Add to Cart"}
        </button>
      </div>

      <Footer />
    </>
  );
}
