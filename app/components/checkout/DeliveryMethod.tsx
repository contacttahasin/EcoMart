import { Leaf } from "lucide-react";

export type DeliveryOption = "standard" | "eco";

type DeliveryMethodProps = {
  selected: DeliveryOption;
  onSelect: (option: DeliveryOption) => void;
};

const OPTIONS: {
  value: DeliveryOption;
  title: string;
  eta: string;
  price: string;
  eco?: boolean;
}[] = [
  { value: "standard", title: "Standard Delivery", eta: "3-5 Business Days", price: "$5.00" },
  {
    value: "eco",
    title: "Eco Carbon Neutral",
    eta: "Consolidated shipping to reduce footprint. 5-7 Business Days",
    price: "FREE",
    eco: true,
  },
];

export function DeliveryMethod({ selected, onSelect }: DeliveryMethodProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <label
            key={option.value}
            className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
              isSelected
                ? "border-primary bg-secondary-container/10"
                : "border-outline-variant bg-white hover:border-primary"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              checked={isSelected}
              onChange={() => onSelect(option.value)}
              className="absolute right-4 top-4 h-4 w-4 accent-primary"
            />
            <div className="mb-1.5 flex items-center gap-1.5 pr-6">
              <span className="font-semibold text-foreground">{option.title}</span>
              {option.eco && <Leaf aria-hidden="true" className="h-4 w-4 text-primary" />}
            </div>
            <span className="mb-4 text-sm text-on-surface-variant">{option.eta}</span>
            <span className="mt-auto text-sm font-semibold text-primary">{option.price}</span>
          </label>
        );
      })}
    </div>
  );
}
