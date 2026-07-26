"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { vendors as vendorSeed, type Vendor } from "@/data/vendors";
import type { VendorBusinessInfo, VendorPersonalInfo } from "@/app/types/vendor";
import { supabase } from "@/lib/supabase";
import { BUSINESS_CATEGORIES, slugify, uniqueSlug } from "@/services/vendor.service";

type VendorProfileRow = {
  id: string;
  shop_name: string;
  slug: string;
  store_name: string | null;
  rating: number;
  total_reviews: number;
  monthly_sales: number;
  verified: boolean;
  featured: boolean;
  joined_date: string;
  location: string | null;
  cover_image_url: string | null;
};

function toVendor(row: VendorProfileRow): Vendor {
  return {
    id: row.id,
    name: row.shop_name,
    slug: row.slug,
    profileUrl: `/vendors/${row.slug}`,
    profileImage: row.cover_image_url,
    storeName: row.store_name ?? "New Merchant",
    rating: row.rating,
    totalReviews: row.total_reviews,
    monthlySales: row.monthly_sales,
    verified: row.verified,
    featured: row.featured,
    joinedDate: row.joined_date,
    location: row.location ?? "",
  };
}

type VendorContextValue = {
  vendors: Vendor[];
  addVendor: (data: { personal: VendorPersonalInfo; business: VendorBusinessInfo }) => Promise<Vendor>;
};

const VendorContext = createContext<VendorContextValue | null>(null);

/** Still seeds the storefront-facing list from the mock data for now — the
 * public vendor directory/product catalog (Phase 2) replaces this with a
 * real `vendor_profiles` query. */
export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(vendorSeed);

  const addVendor = useCallback(
    async (data: { personal: VendorPersonalInfo; business: VendorBusinessInfo }): Promise<Vendor> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed up before completing your business profile.");
      }

      const slugBase = slugify(data.business.shopName) || "vendor";
      const { data: candidates } = await supabase
        .from("vendor_profiles")
        .select("slug")
        .like("slug", `${slugBase}%`)
        .neq("id", user.id);
      const slug = uniqueSlug(
        data.business.shopName,
        (candidates ?? []).map((row) => row.slug)
      );

      const category = BUSINESS_CATEGORIES.find((option) => option.value === data.business.businessCategory);

      const { data: updated, error } = await supabase
        .from("vendor_profiles")
        .update({
          business_name: data.personal.businessName,
          shop_name: data.business.shopName,
          slug,
          store_name: category?.label ?? "New Merchant",
          business_type: data.business.businessType,
          business_category: data.business.businessCategory,
          address: data.business.address,
          postal_code: data.business.postalCode,
          location: data.business.address,
        })
        .eq("id", user.id)
        .select(
          "id, shop_name, slug, store_name, rating, total_reviews, monthly_sales, verified, featured, joined_date, location, cover_image_url"
        )
        .single();

      if (error || !updated) {
        throw new Error(error?.message ?? "Could not save your business profile.");
      }

      const created = toVendor(updated as VendorProfileRow);
      setVendors((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const value = useMemo(() => ({ vendors, addVendor }), [vendors, addVendor]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendors() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendors must be used within a VendorProvider");
  }
  return context;
}
