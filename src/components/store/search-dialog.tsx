"use client";

import { Clock, LoaderCircle, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Dialog } from "@/components/ui/dialog";
import { quickSearch } from "@/lib/actions/search";
import { formatPrice } from "@/lib/format";
import {
  getRecentSearchesServerSnapshot,
  getRecentSearchesSnapshot,
  parseRecentSearches,
  rememberSearch,
  subscribeRecentSearches,
} from "@/lib/recent-searches";
import { useSearchStore } from "@/lib/search-store";
import type { Category, SearchSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Header affordance: a real search field on wide screens, an icon on phones. */
export function SearchTrigger({ className }: { className?: string }) {
  const setOpen = useSearchStore((state) => state.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full p-2 text-ink transition-colors hover:border-ink/40 hover:bg-surface xl:w-56 xl:justify-start xl:border xl:border-line xl:px-3.5 xl:py-2",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-muted xl:size-4" aria-hidden />
      <span className="hidden text-[13px] text-muted xl:inline">Search products…</span>
      <span className="sr-only xl:hidden">Search products</span>
    </button>
  );
}

type SearchState = { term: string; results: SearchSuggestion[] };

export function SearchDialog({ categories }: { categories: Pick<Category, "id" | "name" | "slug">[] }) {
  const open = useSearchStore((state) => state.open);
  const setOpen = useSearchStore((state) => state.setOpen);
  const router = useRouter();

  const [term, setTerm] = React.useState("");
  // Results are stored with the term they belong to, so "is this still
  // loading?" is derived rather than synced through an effect.
  const [state, setState] = React.useState<SearchState | null>(null);

  const recentRaw = React.useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearchesSnapshot,
    getRecentSearchesServerSnapshot,
  );
  const recent = React.useMemo(() => parseRecentSearches(recentRaw), [recentRaw]);

  const trimmed = term.trim();
  const searching = trimmed.length >= 2;
  const current = state && state.term === trimmed ? state : null;
  const results = current?.results ?? [];
  const loading = searching && !current;

  React.useEffect(() => {
    if (!open) return;
    const needle = term.trim();
    if (needle.length < 2) return;

    let cancelled = false;

    // Debounced so a fast typist does not fire a request per keystroke.
    const timer = window.setTimeout(() => {
      quickSearch(needle)
        .then((suggestions) => {
          if (cancelled) return;
          setState({ term: needle, results: suggestions });
        })
        .catch(() => {
          if (cancelled) return;
          setState({ term: needle, results: [] });
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, open]);

  const close = () => setOpen(false);

  const submit = (value: string) => {
    const needle = value.trim();
    if (!needle) return;
    rememberSearch(needle);
    close();
    router.push(`/shop?q=${encodeURIComponent(needle)}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => setOpen(next)}
      title="Search products"
      className="sm:max-w-xl"
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(term);
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          autoFocus
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search for shirts, jeans, black…"
          autoComplete="off"
          className="h-12 w-full rounded-lg border border-line bg-canvas pr-11 pl-10 text-[15px] text-ink placeholder:text-muted/70 focus:border-brand"
        />
        {term ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </form>

      <div className="mt-4 max-h-[60vh] overflow-y-auto overscroll-contain">
        {!searching ? (
          <div className="space-y-4">
            {recent.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                  Recent
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {recent.map((entry) => (
                    <li key={entry}>
                      <button
                        type="button"
                        onClick={() => setTerm(entry)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] hover:border-ink/40"
                      >
                        <Clock className="size-3.5 text-muted" aria-hidden />
                        {entry}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {categories.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                  Browse
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/shop?category=${category.slug}`}
                        onClick={close}
                        className="inline-block rounded-full border border-line px-3 py-1.5 text-[13px] hover:border-ink/40"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-[13px] text-muted">
              Search by product name, category, colour or size.
            </p>
          </div>
        ) : loading ? (
          <p className="flex items-center gap-2 py-6 text-[13px] text-muted" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Searching…
          </p>
        ) : results.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">No products found</p>
            <p className="mt-1 text-[13px] text-muted">
              We could not find anything matching “{trimmed}”.
            </p>
            <Link
              href="/shop"
              onClick={close}
              className="mt-3 inline-block text-[13px] font-medium underline underline-offset-4 hover:text-brand"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {results.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-surface">
                    {product.image ? (
                      <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{product.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted">
                      {[product.category, formatPrice(product.price)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {!product.in_stock ? (
                    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase text-muted">
                      Out of stock
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searching ? (
        <div className="mt-4 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => submit(term)}
            className="text-[13px] font-medium underline underline-offset-4 hover:text-brand"
          >
            View all results for “{trimmed}”
          </button>
        </div>
      ) : null}
    </Dialog>
  );
}
