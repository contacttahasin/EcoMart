import { supabase } from "@/lib/supabase";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type TopVendor = {
  id: string;
  shopName: string;
  slug: string;
  bio: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  verificationStatus: VerificationStatus;
  totalSales: number;
  productCount: number;
  avgRating: number;
  reviewCount: number;
};

type RawTopVendorRow = {
  vendor_id: string;
  shop_name: string;
  slug: string;
  bio: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  verification_status: VerificationStatus;
  total_sales: number;
  product_count: number;
  avg_rating: number;
  review_count: number;
};

function toTopVendor(row: RawTopVendorRow): TopVendor {
  return {
    id: row.vendor_id,
    shopName: row.shop_name,
    slug: row.slug,
    bio: row.bio ?? "",
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    verificationStatus: row.verification_status,
    totalSales: Number(row.total_sales),
    productCount: Number(row.product_count),
    avgRating: Number(row.avg_rating),
    reviewCount: Number(row.review_count),
  };
}

/**
 * Real vendors ranked by real sales (then real product count) — used by the
 * public landing page's "Top Rated Vendors" section. Only vendors with at
 * least one live product are eligible, since an empty shop isn't something
 * a visitor could actually buy from.
 */
export async function fetchTopVendors(limit = 6): Promise<TopVendor[]> {
  const { data, error } = await supabase.rpc("get_top_vendors", { p_limit: limit });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RawTopVendorRow[]).map(toTopVendor);
}

export type PublicVendorProfile = TopVendor & {
  location: string;
  joinedDate: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  linkedinUrl: string | null;
  followerCount: number;
};

type RawVendorBySlugRow = RawTopVendorRow & {
  location: string | null;
  joined_date: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  linkedin_url: string | null;
  follower_count: number;
};

export async function fetchVendorBySlug(slug: string): Promise<PublicVendorProfile | null> {
  const { data, error } = await supabase.rpc("get_vendor_by_slug", { p_slug: slug });
  if (error) throw new Error(error.message);
  const row = (data as RawVendorBySlugRow[] | null)?.[0];
  if (!row) return null;
  return {
    ...toTopVendor(row),
    location: row.location ?? "",
    joinedDate: row.joined_date,
    websiteUrl: row.website_url,
    instagramHandle: row.instagram_handle,
    linkedinUrl: row.linkedin_url,
    followerCount: Number(row.follower_count),
  };
}
