import Image from "next/image";
import Link from "next/link";

import { CategoryCard } from "@/components/store/category-card";
import { Hero } from "@/components/store/hero";
import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeading } from "@/components/store/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/categories";
import { getFeaturedProducts } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { serializeJsonLd, storeJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);

  const featuredLimit = Math.min(Math.max(settings.featured_count ?? 4, 1), 12);
  const featured =
    settings.featured_enabled && featuredLimit > 0 ? await getFeaturedProducts(featuredLimit) : [];

  const showPromo = settings.promo_enabled && Boolean(settings.promo_heading || settings.promo_text);
  const showAbout =
    settings.about_enabled && Boolean(settings.about_heading || settings.about_description);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(storeJsonLd(settings)) }}
      />

      <Hero settings={settings} />

      {categories.length > 0 ? (
        <section className="py-16 sm:py-20">
          <Container className="space-y-8">
            <SectionHeading
              title={settings.categories_heading || "Shop by Category"}
              description={settings.categories_description}
              action={{ label: "View all products", href: "/shop" }}
            />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="border-t border-line py-16 sm:py-20">
          <Container className="space-y-8">
            <SectionHeading
              title={settings.featured_heading || "Featured Collection"}
              description={settings.featured_description}
              action={{ label: "View All", href: "/shop" }}
            />
            <ProductGrid products={featured} currencySymbol={settings.currency_symbol} eager />
          </Container>
        </section>
      ) : null}

      {showPromo ? (
        <section className="border-t border-line bg-surface py-16 sm:py-20">
          <Container
            className={cn(
              "grid items-center gap-10",
              settings.promo_image && "lg:grid-cols-2 lg:gap-16",
            )}
          >
            <div className="max-w-xl space-y-4">
              {settings.promo_heading ? (
                <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                  {settings.promo_heading}
                </h2>
              ) : null}
              {settings.promo_text ? (
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">
                  {settings.promo_text}
                </p>
              ) : null}
              {settings.promo_button_text && settings.promo_button_link ? (
                <Link
                  href={settings.promo_button_link}
                  className={cn(buttonVariants({ variant: "dark", size: "lg" }), "mt-2")}
                >
                  {settings.promo_button_text}
                </Link>
              ) : null}
            </div>

            {settings.promo_image ? (
              <div className="relative aspect-[16/11] overflow-hidden rounded-xl bg-canvas">
                <Image
                  src={settings.promo_image}
                  alt={settings.promo_heading ?? settings.store_name}
                  fill
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      {showAbout ? (
        <section className="border-t border-line py-16 sm:py-20">
          <Container
            className={cn(
              "grid items-center gap-10",
              settings.about_image && "lg:grid-cols-2 lg:gap-16",
            )}
          >
            {settings.about_image ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                <Image
                  src={settings.about_image}
                  alt={settings.about_heading ?? settings.store_name}
                  fill
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className={cn("max-w-xl space-y-4", !settings.about_image && "mx-auto text-center")}>
              {settings.about_heading ? (
                <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                  {settings.about_heading}
                </h2>
              ) : null}
              {settings.about_description ? (
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">
                  {settings.about_description}
                </p>
              ) : null}
              <Link
                href="/about"
                className="inline-block text-sm font-medium underline underline-offset-4 hover:text-brand"
              >
                Read our story
              </Link>
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
