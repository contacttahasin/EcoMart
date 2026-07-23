import { memo } from "react";
import type { ProductVariantGroup } from "@/data/products";

type ProductVariantsProps = {
  variants: ProductVariantGroup[];
  selected: Record<string, string>;
  onSelect: (groupName: string, value: string) => void;
};

function ProductVariantsComponent({ variants, selected, onSelect }: ProductVariantsProps) {
  return (
    <div className="flex flex-col gap-4">
      {variants.map((group) => (
        <fieldset key={group.name}>
          <legend className="text-sm font-semibold text-foreground">{group.name}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isActive = selected[group.name] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelect(group.name, option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-out hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant bg-white text-foreground hover:border-primary"
                  }`}
                >
                  {option.value}
                  {option.priceDelta ? ` (+$${option.priceDelta.toFixed(2)})` : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export const ProductVariants = memo(ProductVariantsComponent);
