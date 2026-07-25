import type { Product } from "@/data/products";
import type { Vendor } from "@/data/vendors";

export type {
  Product,
  ProductCategory,
  ProductReview,
  ProductSpecEntry,
  ProductStatus,
  ProductType,
  ProductVariantGroup,
  ProductVariantOption,
} from "@/data/products";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

/**
 * The composed DTO a single product page renders — the product record plus
 * its resolved vendor profile, exactly what `GET /api/products/:slug` will
 * return once the Express/MongoDB backend exists.
 *
 * Named `vendorProfile` (not `vendor`) because `Product.vendor` is already
 * the vendor's display name (a string) — existing components rely on that.
 */
export type ProductDetail = Product & {
  vendorProfile: Vendor;
};

export type ProductBreadcrumbItem = {
  label: string;
  href?: string;
};
