export type PaginationItem = number | "dots-left" | "dots-right";

/**
 * Canonical pagination metadata shape used across this app.
 *
 * Backend list endpoints (GET /api/products, /api/vendors, /api/orders, /api/users, ...)
 * return this shape with a resource-specific count field instead of `totalItems`
 * (e.g. `totalProducts`, `totalVendors`). Map that field to `totalItems` at the
 * call site — Pagination itself stays resource-agnostic.
 *
 * Example REST response (GET /api/products?page=1&limit=20):
 * { page: 1, limit: 20, totalProducts: 320, totalPages: 16, hasNextPage: true, hasPreviousPage: false }
 */
export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
};

export type UsePaginationOptions = {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
};

export type UsePaginationResult = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
};
