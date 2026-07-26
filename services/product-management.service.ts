import { supabase } from "@/lib/supabase";
import { slugify, uniqueSlug } from "@/services/vendor.service";

export type CategoryOption = { id: string; name: string; slug: string };

export async function fetchTopLevelCategories(): Promise<CategoryOption[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .is("parent_id", null)
    .order("sort_order");
  return data ?? [];
}

export async function fetchSubcategories(parentId: string): Promise<CategoryOption[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("parent_id", parentId)
    .order("sort_order");
  return data ?? [];
}

/** Creates the subcategory row on the fly if the vendor typed a new one that
 * doesn't exist yet under the chosen category — keeps the category picker
 * usable without requiring an admin to pre-seed every subcategory. */
export async function findOrCreateSubcategory(parentId: string, name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await fetchSubcategories(parentId);
  const match = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match.id;

  const slug = uniqueSlug(trimmed, existing.map((c) => c.slug));
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: trimmed, slug, parent_id: parentId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create sub-category.");
  return data.id;
}

export type ProductInput = {
  id: string;
  vendorId: string;
  title: string;
  sku: string;
  description: string;
  categoryId: string | null;
  subcategoryId: string | null;
  videoUrl: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  status: "draft" | "pending_review" | "active";
};

export async function saveProduct(input: ProductInput): Promise<void> {
  const { error } = await supabase.from("products").upsert({
    id: input.id,
    vendor_id: input.vendorId,
    title: input.title,
    sku: input.sku || null,
    description: input.description || null,
    short_description: input.metaDescription || null,
    meta_title: input.metaTitle || null,
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId,
    video_url: input.videoUrl || null,
    slug: input.slug,
    status: input.status,
  });
  if (error) throw new Error(error.message);
}

export async function uploadProductImage(vendorId: string, productId: string, file: File, index: number): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${vendorId}/${productId}/${index}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);
  return publicUrl;
}

export async function replaceProductImages(
  productId: string,
  images: { url: string; isPrimary: boolean }[]
): Promise<void> {
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (images.length === 0) return;

  const { error } = await supabase.from("product_images").insert(
    images.map((image, index) => ({
      product_id: productId,
      url: image.url,
      sort_order: index,
      is_primary: image.isPrimary,
    }))
  );
  if (error) throw new Error(error.message);
}

export type VariantGroupInput = {
  name: string;
  options: { value: string; priceDelta: number; stock: number | null; sku: string }[];
};

export async function replaceProductVariants(productId: string, groups: VariantGroupInput[]): Promise<void> {
  await supabase.from("product_variant_groups").delete().eq("product_id", productId);
  if (groups.length === 0) return;

  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i];
    const { data: groupRow, error: groupError } = await supabase
      .from("product_variant_groups")
      .insert({ product_id: productId, name: group.name, sort_order: i })
      .select("id")
      .single();
    if (groupError || !groupRow) throw new Error(groupError?.message ?? "Could not save variant group.");

    if (group.options.length === 0) continue;

    const { error: optionsError } = await supabase.from("product_variant_options").insert(
      group.options.map((option, index) => ({
        group_id: groupRow.id,
        value: option.value,
        price_delta: option.priceDelta,
        stock: option.stock,
        sku: option.sku || null,
        sort_order: index,
      }))
    );
    if (optionsError) throw new Error(optionsError.message);
  }
}

export async function generateUniqueProductSlug(title: string, vendorId: string): Promise<string> {
  const base = slugify(title) || "product";
  const { data } = await supabase.from("products").select("slug").like("slug", `${base}%`).neq("vendor_id", vendorId);
  return uniqueSlug(title, (data ?? []).map((row) => row.slug));
}
