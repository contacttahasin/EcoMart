"use client";

import { Check, Heart, Minus, Plus, Scale, Share2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/app/context/CartContext";

type ProductActionsProps = {
  product: Product;
  stock: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  productTitle: string;
  productUrl: string;
};

function ProductActionsComponent({
  product,
  stock,
  quantity,
  onQuantityChange,
  productTitle,
  productUrl,
}: ProductActionsProps) {
  const { items, addItem } = useCart();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [compared, setCompared] = useState(false);
  const outOfStock = stock <= 0;
  const isInCart = items.some((item) => item.product.id === product.id);

  const decrease = () => onQuantityChange(Math.max(1, quantity - 1));
  const increase = () => onQuantityChange(Math.min(stock, quantity + 1));

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/checkout");
  };

  const handleShare = async () => {
    if (typeof navigator === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({ title: productTitle, url: productUrl });
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(productUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-foreground">Quantity</span>
        <div className="flex items-center rounded-full border border-outline-variant">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={outOfStock || quantity <= 1}
            onClick={decrease}
            className="flex h-10 w-10 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="h-4 w-4" />
          </button>
          <span aria-live="polite" className="w-10 text-center text-sm font-semibold text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={outOfStock || quantity >= stock}
            onClick={increase}
            className="flex h-10 w-10 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {!outOfStock && <span className="text-xs text-on-surface-variant">{stock} available</span>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleAddToCart}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:bg-outline-variant disabled:text-on-surface-variant ${
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
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleBuyNow}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:border-outline-variant disabled:text-on-surface-variant"
        >
          Buy Now
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => setWishlisted((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-all duration-300 ease-out hover:scale-105 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Heart aria-hidden="true" className={`h-4 w-4 ${wishlisted ? "fill-primary text-primary" : ""}`} />
        </button>
        <button
          type="button"
          aria-label="Share this product"
          onClick={handleShare}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-all duration-300 ease-out hover:scale-105 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Share2 aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-pressed={compared}
          aria-label={compared ? "Remove from compare" : "Add to compare"}
          onClick={() => setCompared((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-all duration-300 ease-out hover:scale-105 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Scale aria-hidden="true" className={`h-4 w-4 ${compared ? "text-primary" : ""}`} />
        </button>
      </div>
    </div>
  );
}

export const ProductActions = memo(ProductActionsComponent);
