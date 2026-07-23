"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaginationItem, PaginationProps } from "@/app/types/pagination";

function range(start: number, end: number): number[] {
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function buildPageItems(currentPage: number, totalPages: number, siblingCount: number): PaginationItem[] {
  const totalVisible = siblingCount * 2 + 5;

  if (totalPages <= totalVisible) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots = leftSibling > 3;
  const showRightDots = rightSibling < totalPages - 2;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = Math.max(siblingCount + 2, currentPage);
    return [...range(1, leftItemCount), "dots-right", totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = Math.max(siblingCount + 2, totalPages - currentPage + 1);
    return [1, "dots-left", ...range(totalPages - rightItemCount + 1, totalPages)];
  }

  return [1, "dots-left", ...range(leftSibling, rightSibling), "dots-right", totalPages];
}

const BUTTON_BASE =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40";

const NEUTRAL_BUTTON =
  "border border-outline-variant bg-white text-foreground hover:scale-105 hover:border-primary hover:bg-secondary-container/40 hover:shadow-md";

const ACTIVE_BUTTON = "border border-primary bg-primary text-white shadow-md";

type PageNumberButtonProps = {
  page: number;
  isActive: boolean;
  disabled: boolean;
  onSelect: (page: number) => void;
};

const PageNumberButton = memo(function PageNumberButton({
  page,
  isActive,
  disabled,
  onSelect,
}: PageNumberButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      onClick={() => onSelect(page)}
      className={`${BUTTON_BASE} ${isActive ? ACTIVE_BUTTON : NEUTRAL_BUTTON}`}
    >
      {page}
    </button>
  );
});

type NavButtonProps = {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
};

const NavButton = memo(function NavButton({ direction, disabled, onClick }: NavButtonProps) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "previous" ? "Previous page" : "Next page"}
      disabled={disabled}
      onClick={onClick}
      className={`${BUTTON_BASE} ${NEUTRAL_BUTTON}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
});

type PaginationEllipsisProps = {
  totalPages: number;
  disabled: boolean;
  onJump: (page: number) => void;
};

const PaginationEllipsis = memo(function PaginationEllipsis({
  totalPages,
  disabled,
  onJump,
}: PaginationEllipsisProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const cancel = () => {
    setIsEditing(false);
    setValue("");
  };

  const commit = () => {
    const page = Number(value);
    if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
      onJump(page);
    }
    cancel();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={totalPages}
        value={value}
        aria-label={`Jump to page, 1 to ${totalPages}`}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Escape") cancel();
          if (event.key === "Enter") commit();
        }}
        className="h-10 w-10 shrink-0 rounded-lg border border-primary bg-white text-center text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label="Jump to a specific page"
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      className={`${BUTTON_BASE} ${NEUTRAL_BUTTON} cursor-text`}
    >
      &hellip;
    </button>
  );
});

function renderPageItem(
  item: PaginationItem,
  currentPage: number,
  totalPages: number,
  disabled: boolean,
  onSelect: (page: number) => void
) {
  if (item === "dots-left" || item === "dots-right") {
    return <PaginationEllipsis key={item} totalPages={totalPages} disabled={disabled} onJump={onSelect} />;
  }
  return (
    <PageNumberButton
      key={item}
      page={item}
      isActive={item === currentPage}
      disabled={disabled}
      onSelect={onSelect}
    />
  );
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  hasNextPage,
  hasPreviousPage,
  isLoading = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);

  const canGoPrevious = !isLoading && (hasPreviousPage ?? safeCurrentPage > 1);
  const canGoNext = !isLoading && (hasNextPage ?? safeCurrentPage < safeTotalPages);

  const handleSelect = useCallback(
    (page: number) => {
      if (page === safeCurrentPage || page < 1 || page > safeTotalPages) return;
      onPageChange(page);
    },
    [onPageChange, safeCurrentPage, safeTotalPages]
  );

  const goPrevious = useCallback(() => handleSelect(safeCurrentPage - 1), [handleSelect, safeCurrentPage]);
  const goNext = useCallback(() => handleSelect(safeCurrentPage + 1), [handleSelect, safeCurrentPage]);

  const fullItems = useMemo(
    () => buildPageItems(safeCurrentPage, safeTotalPages, siblingCount),
    [safeCurrentPage, safeTotalPages, siblingCount]
  );
  const compactItems = useMemo(
    () => buildPageItems(safeCurrentPage, safeTotalPages, 0),
    [safeCurrentPage, safeTotalPages]
  );

  if (safeTotalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" aria-busy={isLoading} className="flex items-center justify-center">
      {/* Mobile: Previous / Current / Next */}
      <div className="flex items-center gap-3 sm:hidden">
        <NavButton direction="previous" disabled={!canGoPrevious} onClick={goPrevious} />
        <span
          aria-live="polite"
          className="inline-flex h-10 min-w-24 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-300"
        >
          Page {safeCurrentPage} of {safeTotalPages}
        </span>
        <NavButton direction="next" disabled={!canGoNext} onClick={goNext} />
      </div>

      {/* Tablet: compact numbered pagination */}
      <div className="hidden items-center gap-2 sm:flex lg:hidden">
        <NavButton direction="previous" disabled={!canGoPrevious} onClick={goPrevious} />
        {compactItems.map((item) => renderPageItem(item, safeCurrentPage, safeTotalPages, isLoading, handleSelect))}
        <NavButton direction="next" disabled={!canGoNext} onClick={goNext} />
      </div>

      {/* Desktop: full numbered pagination */}
      <div className="hidden items-center gap-2 lg:flex">
        <NavButton direction="previous" disabled={!canGoPrevious} onClick={goPrevious} />
        {fullItems.map((item) => renderPageItem(item, safeCurrentPage, safeTotalPages, isLoading, handleSelect))}
        <NavButton direction="next" disabled={!canGoNext} onClick={goNext} />
      </div>
    </nav>
  );
}
