import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

/**
 * Admin reads. These use the request-scoped client so RLS evaluates the
 * signed-in user, and they are never cached (the owner always sees live data).
 */

export type AdminProductFilter = {
  search?: string;
  categoryId?: string;
  status?: "all" | "active" | "draft" | "featured";
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

export async function getAdminProducts(filter: AdminProductFilter = {}): Promise<AdminProductPage> {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = filter.perPage ?? 20;
  const supabase = await createServerSupabaseClient();

  let request = supabase
    .from("products")
    .select(
      "id, name, slug, description, price, compare_at_price, category_id, images, sizes, colors, featured, active, created_at, updated_at, category:categories(id, name, slug)",
      { count: "exact" },
    );

  if (filter.categoryId) request = request.eq("category_id", filter.categoryId);
  if (filter.status === "active") request = request.eq("active", true);
  if (filter.status === "draft") request = request.eq("active", false);
  if (filter.status === "featured") request = request.eq("featured", true);

  const term = filter.search?.replace(/[,()%\\]/g, " ").trim();
  if (term) request = request.ilike("name", `%${term}%`);

  const from = (page - 1) * perPage;
  const { data, error, count } = await request
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []) as unknown as Product[],
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Product | null) ?? null;
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
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();

  const [products, categories, active, featured] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("featured", true),
  ]);

  const firstError = products.error ?? categories.error ?? active.error ?? featured.error;
  if (firstError) throw new Error(firstError.message);

  return {
    products: products.count ?? 0,
    categories: categories.count ?? 0,
    active: active.count ?? 0,
    featured: featured.count ?? 0,
  };
}
