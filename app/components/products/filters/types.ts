export type PriceRange = {
  min: number;
  max: number;
};

export type ProductFiltersState = {
  categories: string[];
  vendors: string[];
  ratings: number[];
  price: PriceRange;
};

export type FilterOption = {
  id: string;
  label: string;
};

export type VendorOption = FilterOption;
