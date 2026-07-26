"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/layout/Footer";
import ProductFilters from "@/app/components/products/ProductFilters";
import ProductGrid from "@/app/components/products/ProductGrid";
import { DEFAULT_PRODUCT_FILTERS } from "@/app/hooks/useProductFilters";
import { getVendorsForCategory } from "@/services/product.service";
import type { ProductFiltersState, VendorOption } from "@/app/components/products/filters/types";

export default function OrganicPage() {
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_PRODUCT_FILTERS);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    getVendorsForCategory("Fresh Produce").then((options) => {
      if (!cancelled) setVendorOptions(options);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start">
        <ProductFilters vendorOptions={vendorOptions} onChange={setFilters} />

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-primary sm:text-4xl">Organic Groceries</h1>
          <p className="mt-2 mb-6 text-base text-on-surface-variant">
            Certified organic produce and pantry staples from vendors we trust.
          </p>

          <ProductGrid category="Fresh Produce" filters={filters} itemsPerPage={6} />
        </div>
      </main>

      <Footer />
    </>
  );
}
