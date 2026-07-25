"use client";

import { useCallback, useState } from "react";
import type { Product } from "@/data/products";

export function useQuickView() {
  const [product, setProduct] = useState<Product | null>(null);

  const open = useCallback((next: Product) => setProduct(next), []);
  const close = useCallback(() => setProduct(null), []);

  return { product, open, close };
}
