import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
  className,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((candidate) => {
    if (totalPages <= 7) return true;
    return candidate === 1 || candidate === totalPages || Math.abs(candidate - page) <= 1;
  });

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      {page > 1 ? (
        <Link
          href={buildHref(basePath, params, page - 1)}
          rel="prev"
          aria-label="Previous page"
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "size-9")}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : null}

      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const gap = previous && candidate - previous > 1;

        return (
          <span key={candidate} className="flex items-center gap-1.5">
            {gap ? <span className="px-1 text-sm text-muted">…</span> : null}
            <Link
              href={buildHref(basePath, params, candidate)}
              aria-current={candidate === page ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                candidate === page
                  ? "bg-ink text-canvas"
                  : "border border-line text-ink hover:border-ink/40",
              )}
            >
              {candidate}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, params, page + 1)}
          rel="next"
          aria-label="Next page"
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "size-9")}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
