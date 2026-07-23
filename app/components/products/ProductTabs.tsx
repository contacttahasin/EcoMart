"use client";

import { Star } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { ProductDetail } from "@/app/types/product";

type ProductTabsProps = {
  product: ProductDetail;
};

type TabDef = {
  id: string;
  label: string;
  content: ReactNode;
};

function SpecList({ entries }: { entries: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <div key={entry.label} className="flex justify-between gap-4 border-b border-outline-variant pb-2 text-sm">
          <dt className="text-on-surface-variant">{entry.label}</dt>
          <dd className="text-right font-medium text-foreground">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewsPanel({ product }: { product: ProductDetail }) {
  if (!product.reviewsList || product.reviewsList.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        No written reviews yet — this product has an average rating of {product.rating.toFixed(1)} from{" "}
        {product.reviews} shoppers.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {product.reviewsList.map((review) => (
        <li key={review.id} className="border-b border-outline-variant pb-5 last:border-b-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">{review.author}</span>
            <span className="text-xs text-on-surface-variant">
              {new Date(review.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${
                  index < review.rating ? "fill-primary text-primary" : "text-outline-variant"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}

export function ProductTabs({ product }: ProductTabsProps) {
  const tabs = useMemo<TabDef[]>(() => {
    const list: TabDef[] = [
      {
        id: "description",
        label: "Description",
        content: <p className="text-sm leading-relaxed text-on-surface-variant">{product.description}</p>,
      },
    ];

    if (product.specifications && product.specifications.length > 0) {
      list.push({
        id: "specifications",
        label: "Specifications",
        content: <SpecList entries={product.specifications} />,
      });
    }

    if (product.nutritionFacts && product.nutritionFacts.length > 0) {
      list.push({
        id: "nutrition",
        label: "Nutrition Facts",
        content: <SpecList entries={product.nutritionFacts} />,
      });
    }

    list.push({
      id: "reviews",
      label: `Reviews (${product.reviews})`,
      content: <ReviewsPanel product={product} />,
    });

    if (product.shippingInfo) {
      list.push({
        id: "shipping",
        label: "Shipping",
        content: <p className="text-sm leading-relaxed text-on-surface-variant">{product.shippingInfo}</p>,
      });
    }

    if (product.returnPolicy) {
      list.push({
        id: "returns",
        label: "Return Policy",
        content: <p className="text-sm leading-relaxed text-on-surface-variant">{product.returnPolicy}</p>,
      });
    }

    if (product.warranty) {
      list.push({
        id: "warranty",
        label: "Warranty",
        content: <p className="text-sm leading-relaxed text-on-surface-variant">{product.warranty}</p>,
      });
    }

    return list;
  }, [product]);

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
      <div
        role="tablist"
        aria-label="Product details"
        className="flex flex-wrap gap-2 border-b border-outline-variant pb-4"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === active?.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTabId(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              tab.id === active?.id
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${active?.id}`} aria-labelledby={`tab-${active?.id}`} className="pt-6">
        {active?.content}
      </div>
    </div>
  );
}
