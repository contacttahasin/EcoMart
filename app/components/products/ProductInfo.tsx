import { Star } from "lucide-react";
import { getEffectivePrice, getStockStatus } from "@/services/product.service";
import type { ProductDetail, StockStatus } from "@/app/types/product";

type ProductInfoProps = {
  product: ProductDetail;
};

const STOCK_LABEL: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

const STOCK_CLASSES: Record<StockStatus, string> = {
  "in-stock": "bg-secondary-container text-primary",
  "low-stock": "bg-primary/10 text-primary",
  "out-of-stock": "bg-outline-variant text-on-surface-variant",
};

export function ProductInfo({ product }: ProductInfoProps) {
  const stockStatus = getStockStatus(product);
  const effectivePrice = getEffectivePrice(product);
  const onSale = product.salePrice !== null && product.salePrice < product.price;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STOCK_CLASSES[stockStatus]}`}>
          {STOCK_LABEL[stockStatus]}
          {stockStatus === "low-stock" ? ` — only ${product.stock} left` : ""}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          {product.category} / {product.subcategory}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{product.title}</h1>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Star aria-hidden="true" className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
        </div>
        <span className="text-on-surface-variant">({product.reviews} reviews)</span>
        <span className="text-on-surface-variant">·</span>
        <span className="text-on-surface-variant">by {product.vendor}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-bold text-foreground">${effectivePrice.toFixed(2)}</span>
        {onSale && (
          <>
            <span className="text-lg text-on-surface-variant line-through">${product.price.toFixed(2)}</span>
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">
              -{product.discount}%
            </span>
          </>
        )}
        {product.unit && <span className="text-sm text-on-surface-variant">/ {product.unit}</span>}
      </div>

      {product.shortDescription && (
        <p className="text-base text-on-surface-variant">{product.shortDescription}</p>
      )}

      {product.highlights && product.highlights.length > 0 && (
        <ul className="flex flex-col gap-2">
          {product.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-outline-variant pt-4 text-sm sm:grid-cols-3">
        {product.brand && (
          <div>
            <dt className="text-on-surface-variant">Brand</dt>
            <dd className="font-medium text-foreground">{product.brand}</dd>
          </div>
        )}
        {product.sku && (
          <div>
            <dt className="text-on-surface-variant">SKU</dt>
            <dd className="font-medium text-foreground">{product.sku}</dd>
          </div>
        )}
        <div>
          <dt className="text-on-surface-variant">Category</dt>
          <dd className="font-medium text-foreground">{product.category}</dd>
        </div>
      </dl>

      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-on-surface-variant"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
