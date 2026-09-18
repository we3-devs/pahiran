import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductPurchase } from "@/components/store/product-purchase";
import { SectionHeading } from "@/components/store/section-heading";
import { Badge, Container } from "@/components/ui/misc";
import { getProducts, getProductBySlug, getProductSlugs, getRelatedProducts } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { discountPercent, formatPrice, truncate } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd, serializeJsonLd, socialMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getProductSlugs();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);

  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  const description = product.description
    ? truncate(product.description, 155)
    : `${product.name} — ${formatPrice(product.price, settings.currency_symbol)} at ${settings.store_name}.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    ...socialMetadata({
      title: `${product.name} · ${settings.store_name}`,
      description,
      path: `/product/${product.slug}`,
      images: product.images?.length ? product.images.slice(0, 2) : undefined,
    }),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);

  if (!product) notFound();

  const [related, inCategory] = await Promise.all([
    getRelatedProducts(product.category_id, product.id, 4),
    product.category_id
      ? getProducts({ categoryId: product.category_id, perPage: 1 })
      : Promise.resolve({ total: 0 }),
  ]);

  const discount = discountPercent(product.price, product.compare_at_price);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(product.category
      ? [{ label: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    { label: product.name, href: `/product/${product.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, settings)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(crumbs)) }}
      />

      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images ?? []} name={product.name} />

          <div className="space-y-6 lg:pt-2">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {product.category ? (
                  <Link
                    href={`/category/${product.category.slug}`}
                    className="text-xs font-semibold tracking-[0.16em] uppercase text-muted hover:text-brand"
                  >
                    {product.category.name}
                  </Link>
                ) : null}
                {discount !== null ? <Badge tone="sale">-{discount}%</Badge> : null}
                {product.featured ? <Badge tone="brand">Featured</Badge> : null}
              </div>

              <h1 className="font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>

              <p className="flex items-baseline gap-3">
                <span className="text-xl font-semibold">
                  {formatPrice(product.price, settings.currency_symbol)}
                </span>
                {discount !== null && product.compare_at_price ? (
                  <span className="text-base text-muted line-through">
                    {formatPrice(product.compare_at_price, settings.currency_symbol)}
                  </span>
                ) : null}
              </p>
            </div>

            {product.description ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">
                {product.description}
              </p>
            ) : null}

            <ProductPurchase product={product} />

            <dl className="grid gap-3 border-t border-line pt-6 text-[13px] sm:grid-cols-2">
              {inCategory.total > 0 && product.category ? (
                <div className="flex justify-between gap-4 sm:block">
                  <dt className="text-muted">Category</dt>
                  <dd className="font-medium sm:mt-0.5">{product.category.name}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-muted">Sizes</dt>
                <dd className="font-medium sm:mt-0.5">
                  {product.sizes?.length ? product.sizes.join(", ") : "One size"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-muted">Colours</dt>
                <dd className="font-medium sm:mt-0.5">
                  {product.colors?.length ? product.colors.join(", ") : "As shown"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-muted">Ordering</dt>
                <dd className="font-medium sm:mt-0.5">WhatsApp — no online payment</dd>
              </div>
            </dl>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-20 space-y-8 border-t border-line pt-14">
            <SectionHeading title="You may also like" />
            <ProductGrid products={related} currencySymbol={settings.currency_symbol} />
          </section>
        ) : null}
      </Container>
    </>
  );
}
