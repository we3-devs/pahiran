import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { ShopToolbar } from "@/components/store/shop-toolbar";
import { Container } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/categories";
import { getProducts, PER_PAGE } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";

type SearchParams = { q?: string; sort?: string; category?: string; page?: string };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: "Shop",
    description: `Browse every piece from ${settings.store_name} — filter by category, price and what is new.`,
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort =
    params.sort === "price-asc" || params.sort === "price-desc" ? params.sort : ("newest" as const);
  const search = params.q?.trim() ?? "";

  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  const activeCategory = categories.find((entry) => entry.slug === params.category);

  const result = await getProducts({
    page,
    perPage: PER_PAGE,
    sort,
    search: search || null,
    categoryId: activeCategory?.id ?? null,
  });

  const friendlySort = sort === "newest" ? undefined : sort;

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />

      <header className="mt-6 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl">
          {activeCategory ? activeCategory.name : "All Products"}
        </h1>
        <p className="max-w-2xl text-[15px] text-muted">
          {activeCategory?.description ??
            `Every piece currently available at ${settings.store_name}. Order on WhatsApp.`}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <ShopToolbar
          key={`${search}-${sort}-${activeCategory?.slug ?? "all"}`}
          categories={categories}
          query={search}
          sort={sort}
          category={activeCategory?.slug ?? ""}
          total={result.total}
        />

        <ProductGrid
          products={result.items}
          currencySymbol={settings.currency_symbol}
          emptyTitle={search ? "No matching products." : "No products found."}
          emptyDescription="Try another category or clear your search."
        />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/shop"
          params={{ q: search || undefined, sort: friendlySort, category: activeCategory?.slug }}
        />
      </div>
    </Container>
  );
}
