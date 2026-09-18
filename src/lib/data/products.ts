import { cache } from "react";

import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { sortOptionValues } from "@/lib/format";
import { DEFAULT_SORT, type AvailabilityFilter, type ProductSort } from "@/lib/shop-filters";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product, ProductWithCategory, SearchSuggestion } from "@/lib/types";

/**
 * Storefront catalogue reads.
 *
 * Search, filtering, sorting and pagination all happen in the database through
 * the `search_products` / `product_facets` functions (see `supabase/schema.sql`),
 * so the browser never downloads the whole catalogue.
 *
 * Two graceful degradations keep a store online rather than blank:
 *   * if the project has not been re-migrated yet, the `in_stock` column may be
 *     missing — we detect it once and fall back to the older column list,
 *     treating everything as in stock;
 *   * if the SQL functions are missing, search falls back to a simpler
 *     `ilike` query (name/description only).
 * Both log a clear "re-run supabase/schema.sql" hint for the owner.
 */

export const PER_PAGE = 12;

const CARD_COLUMNS =
  "id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, featured, active, in_stock, created_at, updated_at, category:categories(id, name, slug)";

const CARD_COLUMNS_LEGACY =
  "id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, featured, active, created_at, updated_at, category:categories(id, name, slug)";

export type ProductQuery = {
  categoryId?: string | null;
  search?: string | null;
  featuredOnly?: boolean;
  availability?: AvailabilityFilter;
  sizes?: string[];
  colors?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  page?: number;
  perPage?: number;
  sort?: ProductSort;
};

export type ProductListResult = {
  items: ProductWithCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ProductFacets = {
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  total: number;
};

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  in_stock: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Row normalisation                                                         */
/* -------------------------------------------------------------------------- */

type RawRow = Record<string, unknown>;

let stockColumnMissing = false;
let searchFunctionsMissing = false;

function isMissingStockColumn(message: string): boolean {
  return /in_stock/i.test(message) && /(column|does not exist|schema cache)/i.test(message);
}

function isMissingFunction(message: string): boolean {
  return (
    /(search_products|product_facets)/i.test(message) &&
    /(does not exist|schema cache|could not find|not found)/i.test(message)
  );
}

function stringsOnly(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  return [];
}

function normalizeProduct(row: RawRow): ProductWithCategory {
  const joined = (row.category ?? null) as { id?: string; name?: string; slug?: string } | null;
  const slug = (row.category_slug as string | undefined) ?? joined?.slug;
  const categoryId = (row.category_id as string | null) ?? null;

  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    price: Number(row.price ?? 0),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    category_id: categoryId,
    images: stringsOnly(row.images),
    sizes: stringsOnly(row.sizes),
    colors: stringsOnly(row.colors),
    featured: Boolean(row.featured),
    active: row.active === undefined ? true : Boolean(row.active),
    // Older databases have no `in_stock` column at all: treat as available.
    in_stock: row.in_stock == null ? true : Boolean(row.in_stock),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    category: slug ? { id: categoryId ?? joined?.id ?? "", name: joined?.name ?? "", slug } : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Demo catalogue (used only when Supabase is not configured)                 */
/* -------------------------------------------------------------------------- */

function demoCategoryName(categoryId: string | null): string | null {
  if (!categoryId) return null;
  return DEMO_CATEGORIES.find((category) => category.id === categoryId)?.name ?? null;
}

function demoCategory(categoryId: string | null) {
  if (!categoryId) return null;
  const match = DEMO_CATEGORIES.find((category) => category.id === categoryId);
  return match ? { id: match.id, name: match.name, slug: match.slug } : null;
}

/** Mirrors the SQL search so the demo storefront behaves like the real one. */
function matchesQuery(product: Product, query: ProductQuery): boolean {
  if (!product.active) return false;
  if (query.categoryId && product.category_id !== query.categoryId) return false;
  if (query.featuredOnly && !product.featured) return false;
  if (query.availability === "in_stock" && !product.in_stock) return false;
  if (query.availability === "out_of_stock" && product.in_stock) return false;
  if (query.minPrice != null && product.price < query.minPrice) return false;
  if (query.maxPrice != null && product.price > query.maxPrice) return false;
  if (query.sizes?.length && !query.sizes.some((size) => product.sizes.includes(size))) return false;
  if (query.colors?.length && !query.colors.some((color) => product.colors.includes(color)))
    return false;

  const term = query.search?.trim().toLowerCase();
  if (term) {
    const haystack = [
      product.name,
      product.description ?? "",
      demoCategoryName(product.category_id) ?? "",
      ...product.sizes,
      ...product.colors,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  return true;
}

function sortProducts(items: ProductWithCategory[], sort: ProductSort): ProductWithCategory[] {
  const list = [...items];
  const byNewest = (a: ProductWithCategory, b: ProductWithCategory) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    case "price-desc":
      return list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
      return list.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || byNewest(a, b) || a.name.localeCompare(b.name),
      );
    default:
      return list.sort((a, b) => byNewest(a, b) || a.name.localeCompare(b.name));
  }
}

function queryDemoProducts(query: ProductQuery, page: number, perPage: number): ProductListResult {
  const matched = DEMO_PRODUCTS.filter((product) => matchesQuery(product, query));
  const sorted = sortProducts(matched.map((product) => ({ ...product, category: demoCategory(product.category_id) })), query.sort ?? DEFAULT_SORT);
  const start = (page - 1) * perPage;
  const total = sorted.length;

  return {
    items: sorted.slice(start, start + perPage),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

function buildFacets(rows: { sizes?: unknown; colors?: unknown; price?: unknown }[]): ProductFacets {
  const sizes: string[] = [];
  const colors: string[] = [];
  const prices = rows
    .map((row) => Number(row.price))
    .filter((price) => Number.isFinite(price));

  rows.forEach((row) => {
    sizes.push(...stringsOnly(row.sizes));
    colors.push(...stringsOnly(row.colors));
  });

  return {
    sizes: sortOptionValues(sizes),
    colors: [...new Set(colors)].sort((a, b) => a.localeCompare(b)),
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    maxPrice: prices.length > 0 ? Math.max(...prices) : null,
    total: rows.length,
  };
}

/* -------------------------------------------------------------------------- */
/*  Supabase catalogue                                                        */
/* -------------------------------------------------------------------------- */

type SelectResult = { data: unknown; error: { message: string } | null; count: number | null };
type SelectBuilder = (columns: string) => PromiseLike<SelectResult>;

/** Runs a products select, retrying once without `in_stock` on older schemas. */
async function selectProducts(build: SelectBuilder): Promise<SelectResult> {
  const result = await build(stockColumnMissing ? CARD_COLUMNS_LEGACY : CARD_COLUMNS);

  if (result.error && !stockColumnMissing && isMissingStockColumn(result.error.message)) {
    console.warn(
      "[products] this database has no `in_stock` column yet — re-run supabase/schema.sql. Every product is treated as in stock until then.",
    );
    stockColumnMissing = true;
    return build(CARD_COLUMNS_LEGACY);
  }

  return result;
}

/** PostgREST filter syntax is comma/paren sensitive — strip anything unsafe. */
function sanitizeSearchTerm(term: string | null | undefined): string {
  return (term ?? "").replace(/[,()%*\\"']/g, " ").trim();
}

function emptyResult(page: number, perPage: number): ProductListResult {
  return { items: [], total: 0, page, perPage, totalPages: 1 };
}

/** Full-featured search through the SQL function (single round trip). */
async function searchViaFunction(
  query: ProductQuery,
  page: number,
  perPage: number,
): Promise<ProductListResult | null> {
  if (searchFunctionsMissing) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("search_products", {
    p_term: query.search?.trim() ? query.search.trim() : null,
    p_category_id: query.categoryId ?? null,
    p_featured_only: Boolean(query.featuredOnly),
    p_sizes: query.sizes?.length ? query.sizes : null,
    p_colors: query.colors?.length ? query.colors : null,
    p_min_price: query.minPrice ?? null,
    p_max_price: query.maxPrice ?? null,
    p_availability: query.availability ?? "all",
    p_sort: query.sort ?? DEFAULT_SORT,
    p_limit: perPage,
    p_offset: (page - 1) * perPage,
  });

  if (error) {
    if (isMissingFunction(error.message)) {
      searchFunctionsMissing = true;
      console.warn(
        "[products] search_products() is missing — re-run supabase/schema.sql for full-text search across colours, sizes and categories. Using the simpler query for now.",
      );
      return null;
    }
    console.error("[products] search failed:", error.message);
    return emptyResult(page, perPage);
  }

  const rows = (data ?? []) as RawRow[];
  const total = rows.length > 0 ? Number(rows[0].total_count ?? rows.length) : 0;

  return {
    items: rows.map(normalizeProduct),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Fallback search using plain PostgREST filters only. */
async function searchViaQuery(
  query: ProductQuery,
  page: number,
  perPage: number,
): Promise<ProductListResult> {
  const supabase = createPublicClient();
  const offset = (page - 1) * perPage;

  const result = await selectProducts((columns) => {
    let request = supabase.from("products").select(columns, { count: "exact" }).eq("active", true);

    if (query.featuredOnly) request = request.eq("featured", true);
    if (query.categoryId) request = request.eq("category_id", query.categoryId);

    if (!stockColumnMissing) {
      if (query.availability === "in_stock") request = request.eq("in_stock", true);
      if (query.availability === "out_of_stock") request = request.eq("in_stock", false);
    }

    if (query.minPrice != null) request = request.gte("price", query.minPrice);
    if (query.maxPrice != null) request = request.lte("price", query.maxPrice);
    if (query.sizes?.length) request = request.overlaps("sizes", query.sizes);
    if (query.colors?.length) request = request.overlaps("colors", query.colors);

    const term = sanitizeSearchTerm(query.search);
    if (term) request = request.or(`name.ilike.*${term}*,description.ilike.*${term}*`);

    const sort = query.sort ?? DEFAULT_SORT;
    if (sort === "price-asc") request = request.order("price", { ascending: true });
    else if (sort === "price-desc") request = request.order("price", { ascending: false });
    else if (sort === "name-asc") request = request.order("name", { ascending: true });
    else if (sort === "featured")
      request = request.order("featured", { ascending: false }).order("created_at", { ascending: false });
    else request = request.order("created_at", { ascending: false });

    return request.range(offset, offset + perPage - 1) as unknown as PromiseLike<SelectResult>;
  });

  if (result.error) {
    console.error("[products] query failed:", result.error.message);
    return emptyResult(page, perPage);
  }

  const rows = (result.data ?? []) as RawRow[];
  const total = result.count ?? rows.length;

  return {
    items: rows.map(normalizeProduct),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

async function fetchProducts(query: ProductQuery): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.max(1, query.perPage ?? PER_PAGE);
  const normalized: ProductQuery = { ...query, page, perPage };

  if (!isSupabaseConfigured()) return queryDemoProducts(normalized, page, perPage);

  try {
    return (await searchViaFunction(normalized, page, perPage)) ?? (await searchViaQuery(normalized, page, perPage));
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return emptyResult(page, perPage);
  }
}

/** Paginated, filtered catalogue. */
export const getProducts = cache(async (query: ProductQuery = {}): Promise<ProductListResult> => {
  return fetchProducts(query);
});

export const getFeaturedProducts = cache(async (limit = 4): Promise<ProductWithCategory[]> => {
  const result = await fetchProducts({ featuredOnly: true, page: 1, perPage: limit });
  return result.items;
});

/** The option values that actually exist — this is what the filters render. */
export const getProductFacets = cache(
  async (categoryId: string | null = null): Promise<ProductFacets> => {
    const fallback = () => {
      const rows = DEMO_PRODUCTS.filter(
        (product) => product.active && (!categoryId || product.category_id === categoryId),
      );
      return buildFacets(rows.map((product) => ({ sizes: product.sizes, colors: product.colors, price: product.price })));
    };

    if (!isSupabaseConfigured()) return fallback();

    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase.rpc("product_facets", { p_category_id: categoryId });

      if (!error) {
        const row = ((data ?? []) as RawRow[])[0];
        if (!row) return fallback();
        return {
          sizes: sortOptionValues(stringsOnly(row.sizes)),
          colors: [...new Set(stringsOnly(row.colors))].sort((a, b) => a.localeCompare(b)),
          minPrice: row.min_price == null ? null : Number(row.min_price),
          maxPrice: row.max_price == null ? null : Number(row.max_price),
          total: Number(row.total ?? 0),
        };
      }

      if (!isMissingFunction(error.message)) {
        console.error("[products] facets failed:", error.message);
        return fallback();
      }
      searchFunctionsMissing = true;

      // Older schema: aggregate the (small) option columns ourselves.
      let legacy = supabase.from("products").select("sizes, colors, price").eq("active", true);
      if (categoryId) legacy = legacy.eq("category_id", categoryId);

      const { data: rows, error: rowsError } = await legacy;

      if (rowsError || !rows) {
        if (rowsError) console.error("[products] facets fallback failed:", rowsError.message);
        return fallback();
      }

      return buildFacets(rows as { sizes?: unknown; colors?: unknown; price?: unknown }[]);
    } catch (error) {
      console.error("[products] unexpected error:", error);
      return fallback();
    }
  },
);

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithCategory | null> => {
  if (!isSupabaseConfigured()) {
    const match = DEMO_PRODUCTS.find((product) => product.slug === slug && product.active);
    return match ? { ...match, category: demoCategory(match.category_id) } : null;
  }

  try {
    const supabase = createPublicClient();
    const result = await selectProducts((columns) =>
      supabase
        .from("products")
        .select(columns)
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle() as unknown as PromiseLike<SelectResult>,
    );

    if (result.error) {
      console.error("[products] failed to load product:", result.error.message);
      return null;
    }
    return result.data ? normalizeProduct(result.data as RawRow) : null;
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
        .map((product) => ({ ...product, category: demoCategory(product.category_id) }));
    }

    try {
      const supabase = createPublicClient();
      const result = await selectProducts((columns) => {
        let request = supabase
          .from("products")
          .select(columns)
          .eq("active", true)
          .neq("id", excludeId)
          .limit(limit);

        if (categoryId) request = request.eq("category_id", categoryId);
        return request as unknown as PromiseLike<SelectResult>;
      });

      if (result.error) {
        console.error("[products] failed to load related products:", result.error.message);
        return [];
      }
      return ((result.data ?? []) as RawRow[]).map(normalizeProduct);
    } catch (error) {
      console.error("[products] unexpected error:", error);
      return [];
    }
  },
);

/** Products for the ids in a cart, used to re-check availability and prices. */
export async function getCartProducts(ids: string[]): Promise<CartProduct[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const toCartProduct = (row: RawRow): CartProduct => ({
    id: row.id as string,
    name: (row.name as string) ?? "",
    slug: (row.slug as string) ?? "",
    price: Number(row.price ?? 0),
    image: stringsOnly(row.images)[0] ?? null,
    in_stock: row.in_stock == null ? true : Boolean(row.in_stock),
  });

  if (!isSupabaseConfigured()) {
    return DEMO_PRODUCTS.filter((product) => product.active && unique.includes(product.id)).map((product) =>
      toCartProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: product.images,
        in_stock: product.in_stock,
      }),
    );
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, images, in_stock")
      .in("id", unique);

    if (!error) return ((data ?? []) as RawRow[]).map(toCartProduct);

    if (!stockColumnMissing && isMissingStockColumn(error.message)) {
      stockColumnMissing = true;
      const retry = await supabase.from("products").select("id, name, slug, price, images").in("id", unique);
      if (retry.error) {
        console.error("[products] cart lookup failed:", retry.error.message);
        return [];
      }
      return ((retry.data ?? []) as RawRow[]).map(toCartProduct);
    }

    console.error("[products] cart lookup failed:", error.message);
    return [];
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return [];
  }
}

/** Lightweight suggestions for the header search box. */
export async function getSearchSuggestions(term: string, limit = 6): Promise<SearchSuggestion[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];

  const toSuggestion = (product: ProductWithCategory): SearchSuggestion => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    image: product.images[0] ?? null,
    category: product.category?.name ?? null,
    in_stock: product.in_stock,
  });

  // Name matches are the most likely intent, so they lead the list.
  const byRelevance = (items: SearchSuggestion[]) => {
    const needle = trimmed.toLowerCase();
    return items
      .map((item) => ({
        item,
        score: item.name.toLowerCase().startsWith(needle)
          ? 0
          : item.name.toLowerCase().includes(needle)
            ? 1
            : 2,
      }))
      .sort((a, b) => a.score - b.score)
      .map((entry) => entry.item);
  };

  try {
    const result = await fetchProducts({ search: trimmed, page: 1, perPage: limit, sort: "featured" });
    return byRelevance(result.items.map(toSuggestion));
  } catch (error) {
    console.error("[products] suggestions failed:", error);
    return [];
  }
}

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
