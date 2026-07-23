"use client";

import { useEffect, useState } from "react";
import type { Product, ProductCategory } from "@/data/products";
import { DEFAULT_SORT, getProducts, type SortOption } from "@/services/product.service";

export type ProductQueryFilters = {
  subcategories?: string[];
  vendorId?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
};

type UseProductsOptions = {
  category?: ProductCategory;
  filters?: ProductQueryFilters;
  search?: string;
  itemsPerPage?: number;
  initialSort?: SortOption;
};

type ProductsResultState = {
  queryKey: string;
  products: Product[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const EMPTY_RESULT_STATE: ProductsResultState = {
  queryKey: "",
  products: [],
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useProducts({
  category,
  filters,
  search,
  itemsPerPage = 12,
  initialSort = DEFAULT_SORT,
}: UseProductsOptions = {}) {
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(1);

  // Jump back to page 1 whenever the query itself changes (not when only `page` does).
  // Adjusting state during render, per https://react.dev/learn/you-might-not-need-an-effect
  const resetKey = JSON.stringify([category, filters, search, sort]);
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  const queryKey = JSON.stringify([category, filters, search, sort, page, itemsPerPage]);
  const [result, setResult] = useState<ProductsResultState>(EMPTY_RESULT_STATE);

  useEffect(() => {
    let cancelled = false;

    getProducts({
      sort,
      category,
      subcategories: filters?.subcategories,
      vendorId: filters?.vendorId,
      minRating: filters?.minRating,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      search,
      page,
      limit: itemsPerPage,
    }).then((response) => {
      if (cancelled) return;
      setResult({
        queryKey,
        products: response.products,
        total: response.total,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [category, filters, search, sort, page, itemsPerPage, queryKey]);

  return {
    products: result.products,
    total: result.total,
    page,
    setPage,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPreviousPage: result.hasPreviousPage,
    sort,
    setSort,
    isLoading: result.queryKey !== queryKey,
  };
}
