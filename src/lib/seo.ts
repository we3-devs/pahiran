import { SITE_URL } from "@/lib/env";
import { truncate } from "@/lib/format";
import type { Category, ProductWithCategory, StoreSettings } from "@/lib/types";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** JSON.stringify plus `<` escaping so it is safe inside a <script> tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function storeJsonLd(settings: StoreSettings) {
  const socials = [settings.facebook, settings.instagram, settings.tiktok, settings.youtube].filter(
    Boolean,
  ) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: settings.store_name,
    description: settings.seo_description ?? settings.description ?? settings.tagline ?? undefined,
    url: SITE_URL,
    image: settings.logo ?? settings.hero_image ?? undefined,
    telephone: settings.phone ?? undefined,
    email: settings.email ?? undefined,
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address }
      : undefined,
    sameAs: socials.length > 0 ? socials : undefined,
  };
}

export function productJsonLd(product: ProductWithCategory, settings: StoreSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ? truncate(product.description, 300) : undefined,
    image: (product.images ?? []).slice(0, 4).map((image) => absoluteUrl(image)),
    sku: product.id,
    category: product.category?.name,
    brand: { "@type": "Brand", name: settings.store_name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: settings.currency_code || "NPR",
      availability: product.active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

export function categoryJsonLd(category: Category) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description ?? undefined,
    url: absoluteUrl(`/category/${category.slug}`),
  };
}

/** Shared Open Graph / Twitter block so pages only pass what differs. */
export function socialMetadata({
  title,
  description,
  path,
  images,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
}) {
  return {
    openGraph: {
      type: "website" as const,
      title,
      description,
      url: absoluteUrl(path),
      siteName: title,
      images: images?.length ? images : undefined,
    },
    twitter: {
      card: images?.length ? ("summary_large_image" as const) : ("summary" as const),
      title,
      description,
      images: images?.length ? images : undefined,
    },
  };
}
