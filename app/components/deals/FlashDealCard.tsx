"use client";

import { Heart, Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { getEffectivePrice } from "@/services/product.service";

type FlashDealCardProps = {
  product: Product;
};

/**
 * There's no real "units sold" data in the catalog, so scarcity is derived
 * from remaining stock: the fewer items left, the more "sold out" the bar
 * reads. Not a real sales figure — just an honest, stock-driven urgency cue.
 */
function getScarcity(stock: number) {
  const percent = Math.max(10, Math.min(95, 100 - Math.min(stock, 100)));
  const urgent = stock <= 10;
  return { percent, urgent };
}

export function FlashDealCard({ product }: FlashDealCardProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const [quantity, setQuantity] = useState(1);

  const effectivePrice = getEffectivePrice(product);
  const { percent, urgent } = getScarcity(product.stock);

  const decrease = () => setQuantity((value) => Math.max(1, value - 1));
  const increase = () => setQuantity((value) => Math.min(product.stock, value + 1));

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="relative h-64 overflow-hidden">
        <Link href={`/product/${product.slug}`} aria-label={`View ${product.title}`} className="absolute inset-0">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        <div className="absolute left-3 top-3 rounded-full bg-error px-3 py-1 text-xs font-semibold text-white shadow-md">
          -{product.discount}% OFF
        </div>
        <button
          type="button"
          aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={wishlisted}
          onClick={() => toggle(product)}
          className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur-md transition-colors hover:bg-white"
        >
          <Heart aria-hidden="true" className={`h-4 w-4 text-primary ${wishlisted ? "fill-primary" : ""}`} />
        </button>
      </div>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs text-on-surface-variant">{product.category}</p>
          <Link
            href={`/product/${product.slug}`}
            className="block truncate text-lg font-semibold transition-colors group-hover:text-primary"
          >
            {product.title}
          </Link>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">${effectivePrice.toFixed(2)}</span>
          <span className="text-sm text-on-surface-variant line-through">${product.price.toFixed(2)}</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">{percent}% Sold</span>
            <span className={urgent ? "font-bold text-error" : "text-on-surface-variant"}>
              {urgent ? `Only ${product.stock} Left!` : `${product.stock} Items Left`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container">
            <div
              className={`h-full rounded-full ${urgent ? "bg-error" : "bg-primary"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex w-1/3 items-center justify-between rounded-xl border border-outline-variant bg-white px-3 py-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={decrease}
              className="text-on-surface-variant transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-medium">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= product.stock}
              onClick={increase}
              className="text-on-surface-variant transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => addItem(product, quantity)}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white transition-all hover:bg-primary-container active:scale-95"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
