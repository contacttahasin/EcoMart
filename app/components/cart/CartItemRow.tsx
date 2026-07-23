"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/app/context/CartContext";
import { useCart } from "@/app/context/CartContext";
import { getEffectivePrice } from "@/services/product.service";

type CartItemRowProps = {
  item: CartItem;
};

export function CartItemRow({ item }: CartItemRowProps) {
  const { removeItem, updateQuantity } = useCart();
  const { product, quantity } = item;
  const effectivePrice = getEffectivePrice(product);
  const lineTotal = effectivePrice * quantity;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl sm:flex-row">
      <Link
        href={`/product/${product.slug}`}
        aria-label={`View ${product.title}`}
        className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-surface sm:w-40"
      >
        <Image src={product.images[0]} alt={product.title} fill sizes="160px" className="object-cover" />
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link
                href={`/product/${product.slug}`}
                className="text-base font-semibold text-foreground transition-colors hover:text-primary sm:text-lg"
              >
                {product.title}
              </Link>
              <p className="mt-1 text-sm text-on-surface-variant">
                {product.category} • {product.vendor}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Remove ${product.title} from cart`}
              onClick={() => removeItem(product.id)}
              className="shrink-0 text-on-surface-variant transition-colors hover:text-red-600"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {product.stock > 0 && product.stock <= 10 && (
            <span className="mt-2 inline-flex items-center rounded-full bg-secondary-container px-2 py-1 text-xs font-semibold text-primary">
              Only {product.stock} left
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-full border border-outline-variant">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => updateQuantity(product.id, quantity - 1)}
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
              disabled={quantity >= product.stock}
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-lg font-bold text-primary">${lineTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
