type DealCategoryTabsProps = {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
};

export function DealCategoryTabs({ categories, active, onSelect }: DealCategoryTabsProps) {
  return (
    <div className="flex gap-4 overflow-x-auto whitespace-nowrap border-b border-outline-variant pb-1">
      {categories.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={`shrink-0 px-6 py-3 text-sm font-medium transition-all ${
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
