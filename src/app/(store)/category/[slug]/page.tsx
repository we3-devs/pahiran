import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { Container } from "@/components/ui/misc";
import { getCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getProducts, PER_PAGE } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { breadcrumbJsonLd, categoryJsonLd, serializeJsonLd, socialMetadata } from "@/lib/seo";
import { truncate } from "@/lib/format";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [category, settings] = await Promise.all([getCategoryBySlug(slug), getStoreSettings()]);

  if (!category) {
    return { title: "Category unavailable", robots: { index: false, follow: false } };
  }

  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name.toLowerCase()} at ${settings.store_name}. Order on WhatsApp.`,
    alternates: { canonical: `/category/${category.slug}` },
    ...socialMetadata({
      title: `${category.name} · ${settings.store_name}`,
      description: truncate(
        category.description ?? `Shop ${category.name} at ${settings.store_name}.`,
        160,
      ),
      path: `/category/${category.slug}`,
      images: category.image ? [category.image] : undefined,
    }),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const [settings, result] = await Promise.all([
    getStoreSettings(),
    getProducts({ categoryId: category.id, page, perPage: PER_PAGE }),
  ]);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: category.name, href: `/category/${category.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(categoryJsonLd(category)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(crumbs)) }}
      />

      <Container className="py-10 sm:py-14">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 max-w-2xl space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl">{category.name}</h1>
          {category.description ? (
            <p className="text-[15px] leading-relaxed text-muted">{category.description}</p>
          ) : null}
        </header>

        <div className="mt-10 space-y-10">
          <ProductGrid
            products={result.items}
            currencySymbol={settings.currency_symbol}
            eager
            emptyTitle="No products found."
            emptyDescription="Try another category or browse the full collection."
          />

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={`/category/${category.slug}`}
          />
        </div>
      </Container>
    </>
  );
}
