import { supabase } from "@/lib/supabase";

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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(base: string, existingSlugs: string[]): string {
  const slugBase = slugify(base) || "vendor";
  if (!existingSlugs.includes(slugBase)) return slugBase;

  let suffix = 2;
  while (existingSlugs.includes(`${slugBase}-${suffix}`)) suffix += 1;
  return `${slugBase}-${suffix}`;
}

export type VendorBranding = {
  shopName: string;
  bio: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  websiteUrl: string;
  instagramHandle: string;
  linkedinUrl: string;
};

export async function fetchVendorBranding(vendorId: string): Promise<VendorBranding | null> {
  const { data } = await supabase
    .from("vendor_profiles")
    .select("shop_name, bio, logo_url, cover_image_url, website_url, instagram_handle, linkedin_url")
    .eq("id", vendorId)
    .single();
  if (!data) return null;
  return {
    shopName: data.shop_name,
    bio: data.bio ?? "",
    logoUrl: data.logo_url,
    coverImageUrl: data.cover_image_url,
    websiteUrl: data.website_url ?? "",
    instagramHandle: data.instagram_handle ?? "",
    linkedinUrl: data.linkedin_url ?? "",
  };
}

export async function updateVendorBranding(
  vendorId: string,
  updates: { shopName?: string; bio?: string; websiteUrl?: string; instagramHandle?: string; linkedinUrl?: string }
): Promise<void> {
  const payload: Record<string, string> = {};
  if (updates.shopName !== undefined) payload.shop_name = updates.shopName;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.websiteUrl !== undefined) payload.website_url = updates.websiteUrl;
  if (updates.instagramHandle !== undefined) payload.instagram_handle = updates.instagramHandle;
  if (updates.linkedinUrl !== undefined) payload.linkedin_url = updates.linkedinUrl;
  await supabase.from("vendor_profiles").update(payload).eq("id", vendorId);
}

async function uploadVendorImage(vendorId: string, file: File, filename: "logo" | "cover"): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${vendorId}/${filename}.${extension}`;

  const { error } = await supabase.storage.from("vendor-branding").upload(path, file, { upsert: true });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("vendor-branding").getPublicUrl(path);
  return `${publicUrl}?t=${Date.now()}`;
}

export async function uploadVendorLogo(vendorId: string, file: File): Promise<string> {
  const url = await uploadVendorImage(vendorId, file, "logo");
  await supabase.from("vendor_profiles").update({ logo_url: url }).eq("id", vendorId);
  return url;
}

export async function uploadVendorCoverImage(vendorId: string, file: File): Promise<string> {
  const url = await uploadVendorImage(vendorId, file, "cover");
  await supabase.from("vendor_profiles").update({ cover_image_url: url }).eq("id", vendorId);
  return url;
}
