import { cache } from "react";

import { DEMO_CATEGORIES } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category } from "@/lib/types";

/** Active categories, ordered for the navbar and category grids. */
export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) {
    return [...DEMO_CATEGORIES].sort((a, b) => a.sort_order - b.sort_order);
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[categories] failed to load categories:", error.message);
      return [];
    }
    return (data ?? []) as Category[];
  } catch (error) {
    console.error("[categories] unexpected error:", error);
    return [];
  }
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  if (!isSupabaseConfigured()) {
    return DEMO_CATEGORIES.find((category) => category.slug === slug && category.active) ?? null;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("[categories] failed to load category:", error.message);
      return null;
    }
    return (data as Category | null) ?? null;
  } catch (error) {
    console.error("[categories] unexpected error:", error);
    return null;
  }
});

/** Slugs + timestamps for `sitemap.ts`. */
export async function getCategorySlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_CATEGORIES.filter((category) => category.active).map((category) => ({
      slug: category.slug,
      updated_at: category.updated_at,
    }));
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("active", true);

    if (error) {
      console.error("[categories] failed to load slugs:", error.message);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error("[categories] unexpected error:", error);
    return [];
  }
}
