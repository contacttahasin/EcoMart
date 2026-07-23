"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import type { ProductDetail } from "@/app/types/product";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";

type ProductState = {
  slug: string | null;
  product: ProductDetail | null;
  relatedProducts: Product[];
  notFound: boolean;
};

const INITIAL_STATE: ProductState = {
  slug: null,
  product: null,
  relatedProducts: [],
  notFound: false,
};

export function useProduct(slug: string) {
  const [state, setState] = useState<ProductState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    getProductBySlug(slug).then(async (product) => {
      if (cancelled) return;

      if (!product) {
        setState({ slug, product: null, relatedProducts: [], notFound: true });
        return;
      }

      const relatedProducts = await getRelatedProducts(product, 8);
      if (cancelled) return;

      setState({ slug, product, relatedProducts, notFound: false });
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return {
    product: state.product,
    relatedProducts: state.relatedProducts,
    notFound: state.notFound,
    isLoading: state.slug !== slug,
  };
}
