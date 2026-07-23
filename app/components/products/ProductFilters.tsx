"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProductFilters } from "@/app/hooks/useProductFilters";
import { CategoryFilter } from "./filters/CategoryFilter";
import { FilterSection } from "./filters/FilterSection";
import { PriceRangeFilter } from "./filters/PriceRangeFilter";
import { RatingFilter } from "./filters/RatingFilter";
import type { FilterOption, ProductFiltersState, VendorOption } from "./filters/types";
import { VendorFilter } from "./filters/VendorFilter";

type ProductFiltersProps = {
  categoryOptions?: FilterOption[];
  vendorOptions?: VendorOption[];
  initialFilters?: ProductFiltersState;
  onChange?: (filters: ProductFiltersState) => void;
};

export default function ProductFilters({
  categoryOptions,
  vendorOptions,
  initialFilters,
  onChange,
}: ProductFiltersProps) {
  const { filters, toggleCategory, setVendor, toggleRating, setPrice, clearAll } =
    useProductFilters(onChange, initialFilters);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = useMemo(
    () =>
      filters.categories.length +
      filters.vendors.length +
      filters.ratings.length +
      (filters.price.min !== 0 || filters.price.max !== 100 ? 1 : 0),
    [filters]
  );

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function renderSections(idPrefix: string) {
    return (
      <>
        <FilterSection title="Category">
          <CategoryFilter
            options={categoryOptions}
            selected={filters.categories}
            onToggle={toggleCategory}
            idPrefix={idPrefix}
          />
        </FilterSection>

        <FilterSection title="Price Range">
          <PriceRangeFilter value={filters.price} onChange={setPrice} />
        </FilterSection>

        <FilterSection title="Vendor">
          <VendorFilter
            options={vendorOptions}
            selected={filters.vendors[0] ?? null}
            onChange={setVendor}
            idPrefix={idPrefix}
          />
        </FilterSection>

        <FilterSection title="Rating">
          <RatingFilter selected={filters.ratings} onToggle={toggleRating} idPrefix={idPrefix} />
        </FilterSection>
      </>
    );
  }

  return (
    <>
      <aside
        aria-label="Product filters"
        className="hidden w-[280px] shrink-0 rounded-2xl bg-white p-6 shadow-md lg:sticky lg:top-[100px] lg:block lg:h-fit"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Filters</h2>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold text-primary transition-colors duration-200 hover:text-on-surface-variant"
          >
            Clear all
          </button>
        </div>

        {renderSections("desktop-")}
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105 lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
            {activeCount}
          </span>
        )}
      </button>

      <div
        className={`fixed inset-0 z-[60] lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
      >
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-[320px] flex-col overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm font-semibold text-primary transition-colors duration-200 hover:text-on-surface-variant"
              >
                Clear all
              </button>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileOpen(false)}
                className="text-on-surface-variant transition-colors duration-200 hover:text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {renderSections("mobile-")}
        </div>
      </div>
    </>
  );
}
