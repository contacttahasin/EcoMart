"use client";

import { useCallback, useEffect, useState } from "react";
import type { PriceRange, ProductFiltersState } from "@/app/components/products/filters/types";

export const DEFAULT_PRICE_RANGE: PriceRange = { min: 0, max: 100 };

export const DEFAULT_PRODUCT_FILTERS: ProductFiltersState = {
  categories: [],
  vendors: [],
  ratings: [],
  price: DEFAULT_PRICE_RANGE,
};

export function useProductFilters(
  onChange?: (filters: ProductFiltersState) => void,
  initialFilters: ProductFiltersState = DEFAULT_PRODUCT_FILTERS
) {
  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);

  // Notify the parent after commit, never synchronously from inside a state
  // updater — calling another component's setState from there is unsafe.
  useEffect(() => {
    onChange?.(filters);
  }, [filters, onChange]);

  const toggleCategory = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((category) => category !== id)
        : [...prev.categories, id],
    }));
  }, []);

  const setVendor = useCallback((id: string) => {
    setFilters((prev) => ({ ...prev, vendors: [id] }));
  }, []);

  const toggleRating = useCallback((rating: number) => {
    setFilters((prev) => ({
      ...prev,
      ratings: prev.ratings.includes(rating)
        ? prev.ratings.filter((value) => value !== rating)
        : [...prev.ratings, rating],
    }));
  }, []);

  const setPrice = useCallback((price: PriceRange) => {
    setFilters((prev) => ({ ...prev, price }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { filters, toggleCategory, setVendor, toggleRating, setPrice, clearAll };
}
