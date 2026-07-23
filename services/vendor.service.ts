import type { Vendor } from "@/data/vendors";
import type { VendorBusinessInfo, VendorPersonalInfo } from "@/app/types/vendor";

export const BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "private-limited", label: "Private Limited Company" },
] as const;

export const BUSINESS_CATEGORIES = [
  { value: "organic-food", label: "Organic Food & Beverage" },
  { value: "sustainable-fashion", label: "Sustainable Fashion" },
  { value: "zero-waste-home", label: "Zero-Waste Home Goods" },
  { value: "eco-tech", label: "Eco-Friendly Tech" },
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(base: string, existingSlugs: string[]): string {
  const slugBase = slugify(base) || "vendor";
  if (!existingSlugs.includes(slugBase)) return slugBase;

  let suffix = 2;
  while (existingSlugs.includes(`${slugBase}-${suffix}`)) suffix += 1;
  return `${slugBase}-${suffix}`;
}

/**
 * Turns the completed registration wizard data into a storefront-facing
 * Vendor record. Banking/payout details collected in the final step are
 * intentionally excluded — they're never part of the public vendors list.
 */
export function buildVendorFromRegistration(
  data: { personal: VendorPersonalInfo; business: VendorBusinessInfo },
  existingSlugs: string[]
): Vendor {
  const slug = uniqueSlug(data.business.shopName, existingSlugs);
  const category = BUSINESS_CATEGORIES.find((option) => option.value === data.business.businessCategory);

  return {
    id: crypto.randomUUID(),
    name: data.business.shopName,
    slug,
    profileUrl: `/vendors/${slug}`,
    profileImage: null,
    storeName: category?.label ?? "New Merchant",
    rating: 0,
    totalReviews: 0,
    monthlySales: 0,
    verified: false,
    featured: false,
    joinedDate: new Date().toISOString().slice(0, 10),
    location: data.business.address,
  };
}
