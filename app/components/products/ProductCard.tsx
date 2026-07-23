"use client";

import { Check, Eye, Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/app/context/CartContext";
import { getEffectivePrice } from "@/services/product.service";

type ProductCardProps = {
  product: Product;
  onQuickView?: (product: Product) => void;
};

function ProductCardComponent({ product, onQuickView }: ProductCardProps) {
  const { items, addItem } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const effectivePrice = getEffectivePrice(product);
  const onSale = product.salePrice !== null && product.salePrice < product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;
  const isInCart = items.some((item) => item.product.id === product.id);

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  return (
    <article className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl motion-reduce:animate-none">
      <div className="relative aspect-square overflow-hidden bg-surface">
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
            className={`object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105 ${
              outOfStock ? "opacity-60" : ""
            }`}
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-col items-start gap-1.5">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant shadow-sm">
              {product.category}
            </span>
            {product.discount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                -{product.discount}%
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            aria-pressed={wishlisted}
            onClick={() => setWishlisted((prev) => !prev)}
            className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-on-surface-variant opacity-100 shadow-md transition-all duration-300 ease-out hover:scale-110 hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
          >
            <Heart aria-hidden="true" className={`h-4 w-4 ${wishlisted ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>

        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-foreground/70 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white">
            Out of Stock
          </div>
        )}

        {!outOfStock && (
          <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-300 ease-out lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
            <button
              type="button"
              aria-label={`Quick view ${product.title}`}
              onClick={() => onQuickView?.(product)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-md transition-colors duration-300 ease-out hover:bg-secondary-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
              Quick View
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="truncate text-xs font-medium text-on-surface-variant">
          by {product.vendor}
        </span>

        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base"
        >
          {product.title}
        </Link>

        <div className="flex items-center gap-1.5 text-sm">
          <Star aria-hidden="true" className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
          <span className="text-on-surface-variant">({product.reviews})</span>
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-foreground">${effectivePrice.toFixed(2)}</span>
          {onSale && (
            <span className="text-sm text-on-surface-variant line-through">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        <span
          className={`text-xs font-medium ${
            outOfStock ? "text-on-surface-variant" : lowStock ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {outOfStock ? "Out of stock" : lowStock ? `Only ${product.stock} left` : "In stock"}
        </span>

        <button
          type="button"
          disabled={outOfStock}
          onClick={handleAddToCart}
          aria-label={
            outOfStock
              ? `${product.title} is out of stock`
              : isInCart
                ? `${product.title} is in your cart`
                : `Add ${product.title} to cart`
          }
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-on-surface-variant disabled:hover:bg-outline-variant ${
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
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardComponent);
