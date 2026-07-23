import { memo } from "react";
import { RadioOption } from "./RadioOption";
import type { VendorOption } from "./types";

const DEFAULT_VENDOR_OPTIONS: VendorOption[] = [
  { id: "greenleaf-co", label: "GreenLeaf Co." },
  { id: "organic-valley", label: "Organic Valley" },
  { id: "earth-harvest", label: "Earth Harvest" },
];

type VendorFilterProps = {
  options?: VendorOption[];
  selected: string | null;
  onChange: (id: string) => void;
  idPrefix?: string;
};

function VendorFilterComponent({
  options = DEFAULT_VENDOR_OPTIONS,
  selected,
  onChange,
  idPrefix = "",
}: VendorFilterProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="sr-only">Vendor</legend>
      {options.map((vendor) => (
        <RadioOption
          key={vendor.id}
          id={`${idPrefix}vendor-${vendor.id}`}
          name={`${idPrefix}vendor`}
          label={vendor.label}
          checked={selected === vendor.id}
          onChange={() => onChange(vendor.id)}
        />
      ))}
    </fieldset>
  );
}

export const VendorFilter = memo(VendorFilterComponent);
