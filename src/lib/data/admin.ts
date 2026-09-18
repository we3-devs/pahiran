import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

/**
 * Admin reads. These use the request-scoped client so RLS evaluates the
 * signed-in user, and they are never cached (the owner always sees live data).
 *
 * If a project has not been re-migrated yet the `in_stock` column is missing;
 * the select falls back to the older column list and reads as "in stock"
 * rather than taking the whole admin panel down.
 */

export type AdminProductFilter = {
  search?: string;
  categoryId?: string;
  status?: "all" | "active" | "draft" | "featured";
  availability?: "all" | "in_stock" | "out_of_stock";
  page?: number;
  perPage?: number;
};

export type AdminProductPage = {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
};

const ADMIN_COLUMNS =
  "id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, featured, active, in_stock, created_at, updated_at, category:categories(id, name, slug)";

const ADMIN_COLUMNS_LEGACY =
  "id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, featured, active, created_at, updated_at, category:categories(id, name, slug)";

let stockColumnMissing = false;

type SelectResult = { data: unknown; error: { message: string } | null; count: number | null };

async function selectProducts(build: (columns: string) => PromiseLike<SelectResult>): Promise<SelectResult> {
  const result = await build(stockColumnMissing ? ADMIN_COLUMNS_LEGACY : ADMIN_COLUMNS);

  if (result.error && !stockColumnMissing && /in_stock/i.test(result.error.message)) {
    console.warn(
      "[admin] this database has no `in_stock` column yet — re-run supabase/schema.sql to enable the availability toggle.",
    );
    stockColumnMissing = true;
    return build(ADMIN_COLUMNS_LEGACY);
  }

  return result;
}

function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as unknown as Product),
    in_stock: row.in_stock == null ? true : Boolean(row.in_stock),
  };
}

export async function getAdminProducts(filter: AdminProductFilter = {}): Promise<AdminProductPage> {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = filter.perPage ?? 20;
  const supabase = await createServerSupabaseClient();

  const result = await selectProducts((columns) => {
    let request = supabase.from("products").select(columns, { count: "exact" });

    if (filter.categoryId) request = request.eq("category_id", filter.categoryId);
    if (filter.status === "active") request = request.eq("active", true);
    if (filter.status === "draft") request = request.eq("active", false);
    if (filter.status === "featured") request = request.eq("featured", true);

    if (!stockColumnMissing) {
      if (filter.availability === "in_stock") request = request.eq("in_stock", true);
      if (filter.availability === "out_of_stock") request = request.eq("in_stock", false);
    }

    const term = filter.search?.replace(/[,()%\\*"']/g, " ").trim();
    if (term) request = request.ilike("name", `%${term}%`);

    const from = (page - 1) * perPage;
    return request
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1) as unknown as PromiseLike<SelectResult>;
  });

  if (result.error) throw new Error(result.error.message);

  const rows = (result.data ?? []) as Record<string, unknown>[];
  const total = result.count ?? rows.length;

  return {
    items: rows.map(normalizeProduct),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeProduct(data as Record<string, unknown>) : null;
}

export async function getAdminCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

/** product counts per category id (used to guard category deletion). */
export async function getCategoryProductCounts(): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("category_id");

  if (error) throw new Error(error.message);

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const id = (row as { category_id: string | null }).category_id;
    if (id) acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
}

export type DashboardStats = {
  products: number;
  categories: number;
  active: number;
  featured: number;
  outOfStock: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();

  const build = (columns: string) =>
    supabase.from("products").select(columns, { count: "exact", head: true });

  const [products, categories, active, featured] = await Promise.all([
    build("*"),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    build("*").eq("active", true),
    build("*").eq("featured", true),
  ]);

  // Availability is counted separately: on an un-migrated database the filter
  // simply does not exist and the count reads as zero.
  const outOfStock =
    stockColumnMissing || active.error || featured.error
      ? null
      : await build("id").eq("in_stock", false);

  const firstError = products.error ?? categories.error ?? active.error ?? featured.error;
  if (firstError) throw new Error(firstError.message);

  if (outOfStock?.error && /in_stock/i.test(outOfStock.error.message)) stockColumnMissing = true;

  return {
    products: products.count ?? 0,
    categories: categories.count ?? 0,
    active: active.count ?? 0,
    featured: featured.count ?? 0,
    outOfStock: outOfStock?.error ? 0 : (outOfStock?.count ?? 0),
  };
}
