"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/layout/Footer";
import { ProductBreadcrumb } from "@/app/components/products/ProductBreadcrumb";
import ProductFilters from "@/app/components/products/ProductFilters";
import ProductGrid from "@/app/components/products/ProductGrid";
import type { ProductFiltersState, VendorOption } from "@/app/components/products/filters/types";
import { DEFAULT_PRODUCT_FILTERS } from "@/app/hooks/useProductFilters";
import { getVendorsForCategory } from "@/services/product.service";

const CATEGORY_OPTIONS = [
  { id: "solar-power", label: "Solar Power" },
  { id: "energy-efficient", label: "Energy Efficient" },
  { id: "recycled-materials", label: "Recycled Materials" },
];

// Electronics run well past the $100 grocery-catalog default (the refurbished
// laptop is $499), so this page seeds a wider starting price range.
const INITIAL_FILTERS: ProductFiltersState = { ...DEFAULT_PRODUCT_FILTERS, price: { min: 0, max: 1000 } };

export default function ElectronicsPage() {
  const [filters, setFilters] = useState<ProductFiltersState>(INITIAL_FILTERS);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    getVendorsForCategory("Electronics").then((options) => {
      if (!cancelled) setVendorOptions(options);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <ProductBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Shop" }, { label: "Sustainable Electronics" }]}
        />

        <header className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Sustainable Electronics</h1>
          <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
            Modern technology built for a better tomorrow. Discover gadgets made from recycled materials, powered by
            the sun, and designed for longevity.
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <ProductFilters
            categoryOptions={CATEGORY_OPTIONS}
            vendorOptions={vendorOptions}
            initialFilters={INITIAL_FILTERS}
            onChange={setFilters}
          />

          <div className="min-w-0 flex-1">
            <ProductGrid category="Electronics" filters={filters} itemsPerPage={4} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
