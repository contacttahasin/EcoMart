import { products as productData, type Product, type ProductCategory } from "@/data/products";
import { vendors as vendorData } from "@/data/vendors";
import type { ProductDetail, StockStatus } from "@/app/types/product";

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

/**
 * Reads from the local data fixture today; swap the body for a
 * `fetch("/api/products?...")` call once the Express/MongoDB API exists.
 * The return shape stays the same either way, so callers never change.
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

  let visible = productData.filter((product) => product.status === "active");

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

/**
 * Reads from the local data fixtures today; swap the body for a
 * `fetch("/api/products/:slug")` call once the Express/MongoDB API exists.
 * The return shape (product + resolved vendor) stays the same either way.
 */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = productData.find((candidate) => candidate.slug === slug && candidate.status === "active");
  if (!product) return null;

  const vendorProfile = vendorData.find((candidate) => candidate.id === product.vendorId);
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

  const scored = productData
    .filter((candidate) => candidate.id !== product.id && candidate.status === "active")
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
