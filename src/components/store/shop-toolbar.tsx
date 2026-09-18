"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Input, Select } from "@/components/ui/input";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function ShopToolbar({
  categories,
  query,
  sort,
  category,
  total,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
  query: string;
  sort: string;
  category: string;
  total: number;
}) {
  const router = useRouter();
  // Initialised from the URL; the parent remounts this component (key=query)
  // whenever the query changes, so no effect-based syncing is needed.
  const [term, setTerm] = React.useState(query);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          action="/shop"
          method="get"
          role="search"
          className="relative w-full sm:max-w-xs"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/shop${buildQuery({ q: term, sort, category })}`);
          }}
        >
          <label htmlFor="shop-search" className="sr-only">
            Search products
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            id="shop-search"
            name="q"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search products"
            className="pl-10"
          />
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        </form>

        <div className="flex items-center gap-3">
          <label htmlFor="shop-sort" className="text-[13px] whitespace-nowrap text-muted">
            Sort by
          </label>
          <Select
            id="shop-sort"
            value={sort}
            className="h-10 w-auto min-w-40"
            onChange={(event) =>
              router.push(`/shop${buildQuery({ q: query, sort: event.target.value, category })}`)
            }
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </Select>
        </div>
      </div>

      {categories.length > 0 ? (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <li>
            <Link
              href={`/shop${buildQuery({ q: query, sort })}`}
              aria-current={!category ? "page" : undefined}
              className={cn(
                "inline-block rounded-full border px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors",
                !category ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink/40",
              )}
            >
              All
            </Link>
          </li>
          {categories.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/shop${buildQuery({ q: query, sort, category: entry.slug })}`}
                aria-current={category === entry.slug ? "page" : undefined}
                className={cn(
                  "inline-block rounded-full border px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors",
                  category === entry.slug
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-ink hover:border-ink/40",
                )}
              >
                {entry.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-[13px] text-muted" role="status">
        {total} {total === 1 ? "product" : "products"}
        {query ? ` for “${query}”` : ""}
      </p>
    </div>
  );
}
