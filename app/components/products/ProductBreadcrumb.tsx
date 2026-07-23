import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ProductBreadcrumbItem } from "@/app/types/product";

type ProductBreadcrumbProps = {
  items: ProductBreadcrumbItem[];
};

export function ProductBreadcrumb({ items }: ProductBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex items-center gap-1.5 whitespace-nowrap text-sm text-on-surface-variant">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors duration-200 hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "truncate font-medium text-foreground" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
