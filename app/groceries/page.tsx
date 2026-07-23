"use client";

import { Search, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/layout/Footer";
import ProductFilters from "@/app/components/products/ProductFilters";
import ProductGrid from "@/app/components/products/ProductGrid";
import { DEFAULT_PRODUCT_FILTERS } from "@/app/hooks/useProductFilters";
import type { ProductFiltersState } from "@/app/components/products/filters/types";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";

const CATEGORY_OPTIONS = [
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "dairy", label: "Dairy & Eggs" },
  { id: "oils-vinegars", label: "Oils & Vinegars" },
  { id: "nuts-seeds", label: "Nuts & Seeds" },
  { id: "pantry-staples", label: "Pantry Staples" },
];

const PILLS = [{ id: "all", label: "All Essentials" }, ...CATEGORY_OPTIONS];

const GROCERY_VENDOR_IDS = new Set(
  products.filter((product) => product.category === "Fresh Produce").map((product) => product.vendorId)
);
const VENDOR_OPTIONS = vendors
  .filter((vendor) => GROCERY_VENDOR_IDS.has(vendor.id))
  .map((vendor) => ({ id: vendor.id, label: vendor.name }));

export default function GroceriesPage() {
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_PRODUCT_FILTERS);
  const [activePill, setActivePill] = useState("all");
  const [search, setSearch] = useState("");

  const handlePillClick = (id: string) => {
    setActivePill(id);
    setFilters((prev) => ({ ...prev, categories: id === "all" ? [] : [id] }));
  };

  // Stable reference: ProductFilters re-notifies via an effect keyed on this
  // callback's identity, so a fresh function here would refire on every
  // parent render and stomp pill-driven filter changes right back to empty.
  const handleFiltersChange = useCallback((next: ProductFiltersState) => {
    setFilters(next);
    if (next.categories.length === 1) {
      setActivePill(next.categories[0]);
    } else if (next.categories.length === 0) {
      setActivePill("all");
    }
  }, []);

  return (
    <>
      <div className="bg-secondary-container py-2 text-center text-on-secondary-container">
        <span className="flex items-center justify-center gap-2 text-sm font-medium">
          <Zap aria-hidden="true" className="h-4 w-4" />
          Same-day Express Grocery Delivery in your area!
        </span>
      </div>

      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-6 space-y-4">
          <div className="relative mx-auto w-full max-w-2xl">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for rice, milk, organic eggs..."
              aria-label="Search groceries"
              className="w-full rounded-full border border-outline-variant bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-2">
            {PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => handlePillClick(pill.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                  activePill === pill.id
                    ? "bg-primary text-white shadow-sm"
                    : "border border-outline-variant bg-white text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <ProductFilters categoryOptions={CATEGORY_OPTIONS} vendorOptions={VENDOR_OPTIONS} onChange={handleFiltersChange} />

          <div className="min-w-0 flex-1">
            <h1 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl">Grocery Essentials</h1>
            <ProductGrid category="Fresh Produce" filters={filters} search={search} itemsPerPage={8} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
