import { memo } from "react";
import { CheckboxOption } from "./CheckboxOption";
import type { FilterOption } from "./types";

const DEFAULT_CATEGORY_OPTIONS: FilterOption[] = [
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "grains", label: "Grains" },
  { id: "dairy", label: "Dairy" },
];

type CategoryFilterProps = {
  options?: FilterOption[];
  selected: string[];
  onToggle: (id: string) => void;
  idPrefix?: string;
};

function CategoryFilterComponent({
  options = DEFAULT_CATEGORY_OPTIONS,
  selected,
  onToggle,
  idPrefix = "",
}: CategoryFilterProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="sr-only">Category</legend>
      {options.map((option) => (
        <CheckboxOption
          key={option.id}
          id={`${idPrefix}category-${option.id}`}
          label={option.label}
          checked={selected.includes(option.id)}
          onChange={() => onToggle(option.id)}
        />
      ))}
    </fieldset>
  );
}

export const CategoryFilter = memo(CategoryFilterComponent);
