"use client";

import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "@/services/product.service";

type ProductToolbarProps = {
  shown: number;
  total: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

export function ProductToolbar({ shown, total, sort, onSortChange }: ProductToolbarProps) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <p className="text-sm text-on-surface-variant">
        Showing <span className="font-semibold text-foreground">{shown}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span>{" "}
        {total === 1 ? "Product" : "Products"}
      </p>

      <div className="relative">
        <label htmlFor="product-sort" className="sr-only">
          Sort products
        </label>
        <select
          id="product-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className="appearance-none rounded-full border border-outline-variant bg-white py-2 pl-4 pr-9 text-sm font-medium text-foreground outline-none transition-colors duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-secondary-container"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
    </div>
  );
}
