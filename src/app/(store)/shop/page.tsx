import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { ShopControls } from "@/components/store/shop-controls";
import { ShopFiltersSidebar } from "@/components/store/shop-filters";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/categories";
import { getProductFacets, getProducts, PER_PAGE } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import {
  countActiveFilters,
  DEFAULT_SORT,
  parseShopParams,
  type ShopSearchParams,
} from "@/lib/shop-filters";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const settings = await getStoreSettings();
  const parsed = parseShopParams(params);
  const filtered =
    Boolean(parsed.query) || countActiveFilters(parsed.filters) > 0 || parsed.page > 1;

  return {
    title: parsed.query ? `Search: ${parsed.query}` : "Shop",
    description: `Browse every piece from ${settings.store_name} — search and filter by category, price, size, colour and availability.`,
    alternates: { canonical: "/shop" },
    // Filtered and searched views are near-duplicates of /shop: noindex them so
    // the canonical listing keeps the ranking.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const parsed = parseShopParams(params);

  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  const activeCategory = categories.find((entry) => entry.slug === parsed.filters.category) ?? null;

  const minPrice = parsed.filters.minPrice ? Number(parsed.filters.minPrice) : null;
  const maxPrice = parsed.filters.maxPrice ? Number(parsed.filters.maxPrice) : null;

  const [facets, result] = await Promise.all([
    getProductFacets(activeCategory?.id ?? null),
    getProducts({
      page: parsed.page,
      perPage: PER_PAGE,
      sort: parsed.sort,
      search: parsed.query || null,
      categoryId: activeCategory?.id ?? null,
      availability: parsed.filters.availability,
      sizes: parsed.filters.sizes,
      colors: parsed.filters.colors,
      minPrice: Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    }),
  ]);

  const heading = parsed.query
    ? `Search results for “${parsed.query}”`
    : (activeCategory?.name ?? "All Products");

  const description =
    activeCategory?.description ??
    (parsed.query
      ? `${result.total} ${result.total === 1 ? "product" : "products"} matched your search at ${settings.store_name}.`
      : `Every piece currently available at ${settings.store_name}. Order on WhatsApp.`);

  const listParams = {
    q: parsed.query || undefined,
    sort: parsed.sort === DEFAULT_SORT ? undefined : parsed.sort,
    category: parsed.filters.category || undefined,
    size: parsed.filters.sizes.join(",") || undefined,
    color: parsed.filters.colors.join(",") || undefined,
    min: parsed.filters.minPrice || undefined,
    max: parsed.filters.maxPrice || undefined,
    availability: parsed.filters.availability === "all" ? undefined : parsed.filters.availability,
  };

  const sharedControls = {
    categories,
    facets: {
      sizes: facets.sizes,
      colors: facets.colors,
      minPrice: facets.minPrice,
      maxPrice: facets.maxPrice,
    },
    filters: parsed.filters,
    query: parsed.query,
    sort: parsed.sort,
  };

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />

      <header className="mt-6 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl">{heading}</h1>
        <p className="max-w-2xl text-[15px] text-muted">{description}</p>
      </header>

      <div className="mt-8 space-y-8">
        <ShopControls {...sharedControls} total={result.total} />

        <div className="lg:grid lg:grid-cols-[210px_1fr] lg:items-start lg:gap-10">
          <ShopFiltersSidebar
            key={JSON.stringify(parsed.filters)}
            {...sharedControls}
          />

          <div className="min-w-0 space-y-10">
            {result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line border-dashed px-6 py-16 text-center">
                <h2 className="text-lg font-medium">No products found</h2>
                <p className="max-w-sm text-sm text-muted">
                  {parsed.query
                    ? `We couldn't find anything matching “${parsed.query}”. Try a different search or clear your filters.`
                    : "Nothing matches this combination of filters yet. Try widening your search."}
                </p>
                <Link
                  href="/shop"
                  className={buttonVariants({ variant: "outline", size: "md" })}
                >
                  Clear filters
                </Link>
              </div>
            ) : (
              <ProductGrid
                products={result.items}
                currencySymbol={settings.currency_symbol}
                eager
              />
            )}

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              basePath="/shop"
              params={listParams}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
