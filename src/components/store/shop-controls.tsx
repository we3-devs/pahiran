"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ShopFiltersSheet, type ShopFacets } from "@/components/store/shop-filters";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  activeFilterChips,
  buildShopQuery,
  EMPTY_FILTERS,
  SORT_OPTIONS,
  type ProductSort,
  type ShopFilters,
} from "@/lib/shop-filters";
import type { Category } from "@/lib/types";

/**
 * Search field, sorting, filter entry point, result count and active filter
 * chips. Everything is driven by the URL, so results are shareable, bookmarkable
 * and survive a refresh.
 */
export function ShopControls({
  categories,
  facets,
  filters,
  query,
  sort,
  total,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
  facets: ShopFacets;
  filters: ShopFilters;
  query: string;
  sort: ProductSort;
  total: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [term, setTerm] = React.useState(query);
  const committed = React.useRef(query);
  const chips = activeFilterChips(filters, categories);

  // Live search, debounced: never a request per keystroke, and only when the
  // term actually changed (so a filter change does not fire a search).
  React.useEffect(() => {
    const trimmed = term.trim();
    if (trimmed === committed.current) return;

    const timer = window.setTimeout(() => {
      committed.current = trimmed;
      router.replace(
        `/shop${buildShopQuery({ query: trimmed, sort, filters, page: 1 })}`,
        { scroll: false },
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [term, sort, filters, router]);

  const applyNow = (value: string) => {
    committed.current = value.trim();
    router.push(`/shop${buildShopQuery({ query: value.trim(), sort, filters, page: 1 })}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            applyNow(term);
          }}
          className="relative w-full sm:max-w-xs"
        >
          <label htmlFor="shop-search" className="sr-only">
            Search products
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="shop-search"
            name="q"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search products"
            className="pr-10 pl-10"
            autoComplete="off"
          />
          {term ? (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                committed.current = "";
                router.push(`/shop${buildShopQuery({ query: "", sort, filters, page: 1 })}`);
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </form>

        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="lg:hidden">
            <ShopFiltersSheet
              categories={categories}
              facets={facets}
              filters={filters}
              query={query}
              sort={sort}
            />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <label htmlFor="shop-sort" className="sr-only">
              Sort products
            </label>
            <Select
              id="shop-sort"
              value={sort}
              className="h-11 w-full min-w-0 sm:w-auto sm:min-w-44"
              onChange={(event) =>
                router.push(
                  `/shop${buildShopQuery({
                    query,
                    sort: event.target.value as ProductSort,
                    filters,
                    page: 1,
                  })}`,
                  { scroll: false },
                )
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-[13px] text-muted" role="status">
          {total} {total === 1 ? "product" : "products"}
          {query ? ` for “${query}”` : ""}
        </p>

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.key}
                href={`/shop${buildShopQuery({ query, sort, filters: chip.next, page: 1 })}`}
                scroll={false}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium hover:border-ink/40"
              >
                {chip.label}
                <X className="size-3" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </Link>
            ))}
            <Link
              href={`/shop${buildShopQuery({ query, sort, filters: EMPTY_FILTERS, page: 1 })}`}
              scroll={false}
              onClick={() => toast("Filters cleared", { variant: "info" })}
              className="text-[12px] font-medium text-muted underline underline-offset-4 hover:text-ink"
            >
              Clear all
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
