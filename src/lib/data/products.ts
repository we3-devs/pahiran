import { cache } from "react";

import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product, ProductWithCategory } from "@/lib/types";

export const PER_PAGE = 12;

// Only the fields the storefront needs — the admin selects everything.
const PRODUCT_CARD_COLUMNS =
  "id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, featured, active, created_at, updated_at, category:categories(id, name, slug)";

export type ProductQuery = {
  categoryId?: string | null;
  search?: string | null;
  featuredOnly?: boolean;
  page?: number;
  perPage?: number;
  sort?: "newest" | "price-asc" | "price-desc";
};

export type ProductListResult = {
  items: ProductWithCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** Removes characters that would break PostgREST filter syntax. */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()%\\]/g, " ").trim();
}

function demoCategory(categoryId: string | null) {
  if (!categoryId) return null;
  const match = DEMO_CATEGORIES.find((category) => category.id === categoryId);
  return match ? { id: match.id, name: match.name, slug: match.slug } : null;
}

function withDemoCategory(product: Product): ProductWithCategory {
  return { ...product, category: demoCategory(product.category_id) };
}

function queryDemoProducts(query: ProductQuery): ProductListResult {
  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? PER_PAGE;
  const term = query.search ? query.search.toLowerCase() : "";

  let items = DEMO_PRODUCTS.filter((product) => product.active);

  if (query.categoryId) items = items.filter((product) => product.category_id === query.categoryId);
  if (query.featuredOnly) items = items.filter((product) => product.featured);
  if (term) {
    items = items.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.description ?? "").toLowerCase().includes(term),
    );
  }

  const sort = query.sort ?? "newest";
  items = [...items].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const total = items.length;
  const start = (page - 1) * perPage;

  return {
    items: items.slice(start, start + perPage).map(withDemoCategory),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

async function fetchProducts(query: ProductQuery): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? PER_PAGE;

  if (!isSupabaseConfigured()) return queryDemoProducts(query);

  try {
    const supabase = createPublicClient();
    let request = supabase
      .from("products")
      .select(PRODUCT_CARD_COLUMNS, { count: "exact" })
      .eq("active", true);

    if (query.categoryId) request = request.eq("category_id", query.categoryId);
    if (query.featuredOnly) request = request.eq("featured", true);

    const term = query.search ? sanitizeSearch(query.search) : "";
    if (term) request = request.or(`name.ilike.%${term}%,description.ilike.%${term}%`);

    const sort = query.sort ?? "newest";
    if (sort === "price-asc") request = request.order("price", { ascending: true });
    else if (sort === "price-desc") request = request.order("price", { ascending: false });
    else request = request.order("created_at", { ascending: false });

    const from = (page - 1) * perPage;
    const { data, error, count } = await request.range(from, from + perPage - 1);

    if (error) {
      console.error("[products] query failed:", error.message);
      return { items: [], total: 0, page, perPage, totalPages: 1 };
    }

    const total = count ?? 0;
    return {
      items: (data ?? []) as unknown as ProductWithCategory[],
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return { items: [], total: 0, page, perPage, totalPages: 1 };
  }
}

/** Paginated catalogue. */
export const getProducts = cache(async (query: ProductQuery = {}): Promise<ProductListResult> => {
  return fetchProducts(query);
});

export const getFeaturedProducts = cache(async (limit = 4): Promise<ProductWithCategory[]> => {
  const result = await fetchProducts({ featuredOnly: true, page: 1, perPage: limit });
  return result.items;
});

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithCategory | null> => {
  if (!isSupabaseConfigured()) {
    const match = DEMO_PRODUCTS.find((product) => product.slug === slug && product.active);
    return match ? withDemoCategory(match) : null;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_CARD_COLUMNS)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("[products] failed to load product:", error.message);
      return null;
    }
    return (data as unknown as ProductWithCategory | null) ?? null;
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return null;
  }
});

export const getRelatedProducts = cache(
  async (
    categoryId: string | null,
    excludeId: string,
    limit = 4,
  ): Promise<ProductWithCategory[]> => {
    if (!isSupabaseConfigured()) {
      return DEMO_PRODUCTS.filter(
        (product) =>
          product.active &&
          product.id !== excludeId &&
          (!categoryId || product.category_id === categoryId),
      )
        .slice(0, limit)
        .map(withDemoCategory);
    }

    try {
      const supabase = createPublicClient();
      let request = supabase
        .from("products")
        .select(PRODUCT_CARD_COLUMNS)
        .eq("active", true)
        .neq("id", excludeId)
        .limit(limit);

      if (categoryId) request = request.eq("category_id", categoryId);

      const { data, error } = await request;
      if (error) {
        console.error("[products] failed to load related products:", error.message);
        return [];
      }
      return (data ?? []) as unknown as ProductWithCategory[];
    } catch (error) {
      console.error("[products] unexpected error:", error);
      return [];
    }
  },
);

/** Slugs + timestamps for `sitemap.ts` and `generateStaticParams`. */
export async function getProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_PRODUCTS.filter((product) => product.active).map((product) => ({
      slug: product.slug,
      updated_at: product.updated_at,
    }));
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[products] failed to load slugs:", error.message);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return [];
  }
}

/** Category counters shown next to the category filter on /shop. */
export function countProductsByCategory(products: ProductWithCategory[]): Record<string, number> {
  return products.reduce<Record<string, number>>((acc, product) => {
    if (product.category_id) acc[product.category_id] = (acc[product.category_id] ?? 0) + 1;
    return acc;
  }, {});
}
