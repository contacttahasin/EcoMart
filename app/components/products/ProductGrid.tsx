"use client";

import { PackageSearch } from "lucide-react";
import { useMemo } from "react";
import type { ProductCategory } from "@/data/products";
import Pagination from "@/app/components/common/Pagination";
import { useProducts, type ProductQueryFilters } from "@/app/hooks/useProducts";
import { useQuickView } from "@/app/hooks/useQuickView";
import { ProductCard } from "./ProductCard";
import { ProductToolbar } from "./ProductToolbar";
import { QuickViewModal } from "./QuickViewModal";
import type { ProductFiltersState } from "./filters/types";

const CATEGORY_FILTER_TO_SUBCATEGORY: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  grains: "Grains",
  dairy: "Dairy",
  "oils-vinegars": "Oils & Vinegars",
  "nuts-seeds": "Nuts & Seeds",
  "pantry-staples": "Pantry Staples",
};

type ProductGridProps = {
  category?: ProductCategory;
  filters?: ProductFiltersState;
  search?: string;
  itemsPerPage?: number;
};

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="aspect-square animate-pulse bg-surface" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-surface" />
            <div className="h-8 w-full animate-pulse rounded-full bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({ category, filters, search, itemsPerPage = 8 }: ProductGridProps) {
  const quickView = useQuickView();
  const subcategoriesKey = filters?.categories.join(",") ?? "";
  const subcategories = useMemo(
    () =>
      (filters?.categories ?? [])
        .map((id) => CATEGORY_FILTER_TO_SUBCATEGORY[id])
        .filter((value): value is string => Boolean(value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subcategoriesKey]
  );

  const vendorId = filters?.vendors[0];
  const minRating = filters && filters.ratings.length > 0 ? Math.min(...filters.ratings) : undefined;
  const minPrice = filters?.price.min;
  const maxPrice = filters?.price.max;

  const queryFilters = useMemo<ProductQueryFilters>(
    () => ({ subcategories, vendorId, minRating, minPrice, maxPrice }),
    [subcategories, vendorId, minRating, minPrice, maxPrice]
  );

  const { products, total, page, setPage, totalPages, hasNextPage, hasPreviousPage, sort, setSort, isLoading } =
    useProducts({ category, filters: queryFilters, search, itemsPerPage });

  return (
    <div>
      <ProductToolbar shown={products.length} total={total} sort={sort} onSortChange={setSort} />

      {isLoading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={quickView.open} />
            ))}
          </div>

          <div className="mt-10">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container"
          >
            <PackageSearch className="h-8 w-8 text-primary" />
          </div>
          <p className="text-base font-medium text-on-surface-variant">
            No products found. Try adjusting your filters.
          </p>
        </div>
      )}

      <QuickViewModal product={quickView.product} onClose={quickView.close} />
    </div>
  );
}
