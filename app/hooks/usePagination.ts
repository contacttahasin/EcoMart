"use client";

import { useCallback, useMemo, useState } from "react";
import type { UsePaginationOptions, UsePaginationResult } from "@/app/types/pagination";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function usePagination({
  totalItems,
  itemsPerPage = 20,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationResult {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [page, setPage] = useState(initialPage);
  const currentPage = clamp(page, 1, totalPages);

  const goToPage = useCallback(
    (next: number) => setPage(clamp(next, 1, totalPages)),
    [totalPages]
  );

  const nextPage = useCallback(
    () => setPage((prev) => clamp(prev + 1, 1, totalPages)),
    [totalPages]
  );

  const previousPage = useCallback(
    () => setPage((prev) => clamp(prev - 1, 1, totalPages)),
    [totalPages]
  );

  const firstPage = useCallback(() => setPage(1), []);
  const lastPage = useCallback(() => setPage(totalPages), [totalPages]);

  return useMemo(
    () => ({
      currentPage,
      totalPages,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      goToPage,
      nextPage,
      previousPage,
      firstPage,
      lastPage,
    }),
    [currentPage, totalPages, itemsPerPage, goToPage, nextPage, previousPage, firstPage, lastPage]
  );
}
