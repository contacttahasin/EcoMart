import type { Product, ProductCategory, ProductStatus, ProductVariantGroup } from "@/data/products";
import type { Vendor } from "@/data/vendors";
import type { ProductDetail, StockStatus } from "@/app/types/product";
import { supabase } from "@/lib/supabase";
import { fetchVendorBySlug } from "@/services/public-vendor.service";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low-high", label: "Price Low to High" },
  { value: "price-high-low", label: "Price High to Low" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "best-selling", label: "Best Selling" },
  { value: "most-popular", label: "Most Popular" },
  { value: "newest-arrivals", label: "Newest Arrivals" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortOption = "newest";

export type GetProductsParams = {
  sort?: SortOption;
  category?: ProductCategory;
  subcategories?: string[];
  vendorId?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
};

export type GetProductsResult = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function getEffectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return "out-of-stock";
  if (product.stock <= 10) return "low-stock";
  return "in-stock";
}

function sortProducts(list: Product[], sort: SortOption): Product[] {
  const sorted = [...list];

  switch (sort) {
    case "price-low-high":
      return sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case "price-high-low":
      return sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    case "highest-rated":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "best-selling":
      return sorted.sort(
        (a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.reviews - a.reviews
      );
    case "most-popular":
      return sorted.sort((a, b) => b.reviews - a.reviews);
    case "newest-arrivals":
      return sorted.sort(
        (a, b) =>
          Number(b.newArrival) - Number(a.newArrival) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

const NEW_ARRIVAL_WINDOW_DAYS = 30;
const BEST_SELLER_THRESHOLD = 10;
const FEATURED_MIN_RATING = 4.5;
const FEATURED_MIN_REVIEWS = 3;

type RawCategoryRef = { name: string } | null;
type RawVendorRef = { shop_name: string } | null;
type RawProductImage = { url: string; is_primary: boolean; sort_order: number };
type RawVariantOption = { value: string; price_delta: number | null; sort_order: number };
type RawVariantGroup = { name: string; sort_order: number; product_variant_options: RawVariantOption[] };

type RawProductRow = {
  id: string;
  vendor_id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number | string;
  sale_price: number | string | null;
  sku: string | null;
  unit: string | null;
  stock: number;
  status: ProductStatus;
  video_url: string | null;
  return_policy: string | null;
  warranty: string | null;
  shipping_info: string | null;
  tags: string[] | null;
  highlights: string[] | null;
  rating: number | string;
  review_count: number;
  units_sold: number;
  created_at: string;
  updated_at: string;
  category: RawCategoryRef;
  subcategory: RawCategoryRef;
  vendor_profiles: RawVendorRef;
  product_images: RawProductImage[] | null;
  product_variant_groups: RawVariantGroup[] | null;
};

const PRODUCT_SELECT = `
  id, vendor_id, title, slug, description, short_description, price, sale_price,
  sku, unit, stock, status, video_url, return_policy, warranty, shipping_info,
  tags, highlights, rating, review_count, units_sold, created_at, updated_at,
  category:categories!products_category_id_fkey(name),
  subcategory:categories!products_subcategory_id_fkey(name),
  vendor_profiles(shop_name),
  product_images(url, is_primary, sort_order),
  product_variant_groups(name, sort_order, product_variant_options(value, price_delta, sort_order))
`;

function toVariantGroups(groups: RawVariantGroup[] | null): ProductVariantGroup[] | undefined {
  if (!groups || groups.length === 0) return undefined;
  return [...groups]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      name: group.name,
      options: [...group.product_variant_options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          value: option.value,
          ...(option.price_delta ? { priceDelta: Number(option.price_delta) } : {}),
        })),
    }));
}

function toProduct(row: RawProductRow): Product {
  const price = Number(row.price);
  const salePrice = row.sale_price !== null ? Number(row.sale_price) : null;
  const rating = Number(row.rating);
  const daysSinceCreated = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.url);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    price,
    salePrice,
    images,
    category: (row.category?.name ?? "") as ProductCategory,
    subcategory: row.subcategory?.name ?? "",
    vendor: row.vendor_profiles?.shop_name ?? "Unknown Vendor",
    vendorId: row.vendor_id,
    stock: row.stock,
    rating,
    reviews: row.review_count,
    discount: salePrice ? Math.round((1 - salePrice / price) * 100) : 0,
    featured: rating >= FEATURED_MIN_RATING && row.review_count >= FEATURED_MIN_REVIEWS,
    bestSeller: row.units_sold >= BEST_SELLER_THRESHOLD,
    newArrival: daysSinceCreated <= NEW_ARRIVAL_WINDOW_DAYS,
    status: row.status,
    type: "product",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? undefined,
    shortDescription: row.short_description ?? undefined,
    highlights: row.highlights ?? undefined,
    sku: row.sku ?? undefined,
    unit: row.unit ?? undefined,
    video: row.video_url,
    variants: toVariantGroups(row.product_variant_groups),
    shippingInfo: row.shipping_info ?? undefined,
    returnPolicy: row.return_policy ?? undefined,
    warranty: row.warranty ?? undefined,
  };
}

/**
 * Fetches every active real product fresh on each call and hands back a
 * plain in-memory array — the catalog is small enough that filtering,
 * sorting, and scoring against it in JS (below) is simpler and safer than
 * splitting that logic between PostgREST filters and application code, and
 * an uncached fetch means stock/price changes (e.g. from a real checkout)
 * are always reflected on the next call rather than served stale.
 */
async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("status", "active");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawProductRow[]).map(toProduct);
}

/**
 * Queries the real `products` table (with its category, vendor, image, and
 * variant relations) and applies the same filter/sort/paginate pipeline this
 * function has always used — only the data source changed.
 */
export async function getProducts(params: GetProductsParams = {}): Promise<GetProductsResult> {
  const {
    sort = DEFAULT_SORT,
    category,
    subcategories,
    vendorId,
    minRating,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 12,
  } = params;

  let visible = await fetchActiveProducts();

  if (category) {
    visible = visible.filter((product) => product.category === category);
  }

  if (subcategories && subcategories.length > 0) {
    visible = visible.filter((product) => subcategories.includes(product.subcategory));
  }

  if (vendorId) {
    visible = visible.filter((product) => product.vendorId === vendorId);
  }

  if (minRating !== undefined) {
    visible = visible.filter((product) => product.rating >= minRating);
  }

  if (minPrice !== undefined) {
    visible = visible.filter((product) => getEffectivePrice(product) >= minPrice);
  }

  if (maxPrice !== undefined) {
    visible = visible.filter((product) => getEffectivePrice(product) <= maxPrice);
  }

  if (search && search.trim()) {
    const query = search.trim().toLowerCase();
    visible = visible.filter((product) => product.title.toLowerCase().includes(query));
  }

  const sorted = sortProducts(visible, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    products: sorted.slice(start, start + limit),
    total,
    page: safePage,
    limit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

/** Fetches specific real products by id (e.g. for a wishlist) in one query, rather than the whole catalog. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids).eq("status", "active");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawProductRow[]).map(toProduct);
}

/** Distinct real vendors with at least one active product in `category` — used to populate a category page's vendor filter checkboxes. */
export async function getVendorsForCategory(category: ProductCategory): Promise<{ id: string; label: string }[]> {
  const products = await fetchActiveProducts();
  const seen = new Map<string, string>();
  for (const product of products) {
    if (product.category === category && !seen.has(product.vendorId)) {
      seen.set(product.vendorId, product.vendor);
    }
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }));
}

function toVendor(vendorProfile: Awaited<ReturnType<typeof fetchVendorBySlug>>): Vendor | null {
  if (!vendorProfile) return null;
  return {
    id: vendorProfile.id,
    name: vendorProfile.shopName,
    slug: vendorProfile.slug,
    profileUrl: `/vendors/${vendorProfile.slug}`,
    profileImage: vendorProfile.logoUrl,
    storeName: vendorProfile.bio || vendorProfile.shopName,
    rating: vendorProfile.avgRating,
    totalReviews: vendorProfile.reviewCount,
    monthlySales: vendorProfile.totalSales,
    verified: vendorProfile.verificationStatus === "approved",
    featured: vendorProfile.verificationStatus === "approved" && vendorProfile.reviewCount >= FEATURED_MIN_REVIEWS,
    joinedDate: vendorProfile.joinedDate ?? "",
    location: vendorProfile.location,
  };
}

/**
 * Fetches a real product by slug plus its resolved real vendor profile (via
 * the same public vendor RPC the storefront's vendor pages already use).
 */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const products = await fetchActiveProducts();
  const product = products.find((candidate) => candidate.slug === slug);
  if (!product) return null;

  const { data: vendorRow } = await supabase
    .from("vendor_profiles")
    .select("slug")
    .eq("id", product.vendorId)
    .single();
  if (!vendorRow) return null;

  const vendorProfile = toVendor(await fetchVendorBySlug(vendorRow.slug));
  if (!vendorProfile) return null;

  return { ...product, vendorProfile };
}

/**
 * Ranks every other active product by relevance to `product` — same category,
 * then same subcategory, then shared tags — and returns the top matches.
 * Falls back to top-rated products when nothing scores above zero, so the
 * "Related Products" section is never empty.
 */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const tagSet = new Set(product.tags ?? []);
  const products = await fetchActiveProducts();

  const scored = products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === product.category) score += 3;
      if (candidate.subcategory === product.subcategory) score += 2;
      score += (candidate.tags ?? []).filter((tag) => tagSet.has(tag)).length;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || b.candidate.rating - a.candidate.rating);

  return scored.slice(0, limit).map(({ candidate }) => candidate);
}
