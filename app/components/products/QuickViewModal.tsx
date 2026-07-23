"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, ShoppingCart, Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/app/context/CartContext";
import { getEffectivePrice } from "@/services/product.service";
import { ProductVariants } from "./ProductVariants";

type QuickViewModalProps = {
  product: Product | null;
  onClose: () => void;
};

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { items, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Reset transient state whenever a different product is opened — adjusting
  // state during render (not in an effect) per https://react.dev/learn/you-might-not-need-an-effect
  const [lastProductId, setLastProductId] = useState<string | null>(product?.id ?? null);
  if ((product?.id ?? null) !== lastProductId) {
    setLastProductId(product?.id ?? null);
    setQuantity(1);
    setSelectedVariants({});
  }

  const isInCart = product ? items.some((item) => item.product.id === product.id) : false;

  useEffect(() => {
    if (!product) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  const outOfStock = (product?.stock ?? 0) <= 0;

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view — ${product.title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative grid max-h-[90vh] w-full max-w-3xl grid-cols-1 gap-6 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:grid-cols-2 sm:p-8"
          >
            <button
              type="button"
              aria-label="Close quick view"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-on-surface-variant shadow-md transition-transform duration-300 ease-out hover:scale-105 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface">
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                sizes="(min-width: 640px) 40vw, 90vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                {product.category} / {product.subcategory}
              </span>
              <h2 className="pr-8 text-xl font-bold text-foreground sm:text-2xl">{product.title}</h2>

              <div className="flex items-center gap-2 text-sm">
                <Star aria-hidden="true" className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
                <span className="text-on-surface-variant">({product.reviews} reviews)</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-bold text-foreground">
                  ${getEffectivePrice(product).toFixed(2)}
                </span>
                {product.salePrice !== null && product.salePrice < product.price && (
                  <span className="text-base text-on-surface-variant line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                {product.unit && <span className="text-sm text-on-surface-variant">/ {product.unit}</span>}
              </div>

              {product.shortDescription && (
                <p className="text-sm text-on-surface-variant">{product.shortDescription}</p>
              )}

              {product.variants && product.variants.length > 0 && (
                <ProductVariants
                  variants={product.variants}
                  selected={selectedVariants}
                  onSelect={(groupName, value) =>
                    setSelectedVariants((prev) => ({ ...prev, [groupName]: value }))
                  }
                />
              )}

              <div className="mt-auto flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-outline-variant">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={outOfStock || quantity <= 1}
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      className="flex h-9 w-9 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Minus aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <span aria-live="polite" className="w-8 text-center text-sm font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={outOfStock || quantity >= product.stock}
                      onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                      className="flex h-9 w-9 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {outOfStock ? "Out of stock" : `${product.stock} available`}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addItem(product, quantity)}
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:bg-outline-variant disabled:text-on-surface-variant ${
                    isInCart
                      ? "bg-secondary-container text-primary hover:bg-secondary-container/80"
                      : "bg-primary text-white hover:bg-on-surface-variant"
                  }`}
                >
                  {isInCart ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <ShoppingCart aria-hidden="true" className="h-4 w-4" />
                  )}
                  {outOfStock ? "Out of Stock" : isInCart ? "Added to Cart" : "Add to Cart"}
                </button>

                <Link
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="text-center text-sm font-semibold text-primary transition-colors duration-200 hover:text-on-surface-variant"
                >
                  View Full Details →
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
