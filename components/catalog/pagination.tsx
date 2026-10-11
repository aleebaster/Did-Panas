import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}

function pageNumbers(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Пагінація каталогу"
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="grid size-9 place-items-center rounded-md border border-border transition hover:border-ink hover:bg-muted"
          aria-label="Попередня сторінка"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {pageNumbers(page, totalPages).map((pageNumber) => (
        <Link
          key={pageNumber}
          href={hrefFor(pageNumber)}
          aria-current={pageNumber === page ? "page" : undefined}
          className={cn(
            "grid min-w-9 place-items-center rounded-md border px-2 text-sm transition",
            pageNumber === page
              ? "border-ink bg-ink text-cream"
              : "border-border hover:border-ink hover:bg-muted",
          )}
        >
          {pageNumber}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="grid size-9 place-items-center rounded-md border border-border transition hover:border-ink hover:bg-muted"
          aria-label="Наступна сторінка"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
