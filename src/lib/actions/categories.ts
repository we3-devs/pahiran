"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-guard";
import { BUCKETS } from "@/lib/env";
import { slugify } from "@/lib/format";
import { removeStorageFiles } from "@/lib/storage-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { hasErrors, validateCategory, type CategoryInput } from "@/lib/validation";

export type CategoryFormValues = CategoryInput & { id?: string | null };

const GENERIC_ERROR = "Unable to save changes. Please try again.";

export async function saveCategory(
  input: CategoryFormValues,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  const fieldErrors = validateCategory(input);
  if (hasErrors(fieldErrors)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const payload = {
    name: input.name.trim(),
    slug: slugify(input.slug),
    description: input.description.trim() || null,
    image: input.image?.trim() || null,
    active: input.active,
    sort_order: input.sortOrder.trim() ? Number(input.sortOrder) : 0,
  };

  try {
    const supabase = await createServerSupabaseClient();

    const { data: clash, error: lookupError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", payload.slug)
      .maybeSingle();

    if (lookupError) return { ok: false, error: GENERIC_ERROR };
    if (clash && clash.id !== input.id) {
      return {
        ok: false,
        error: "That slug is already used by another category.",
        fieldErrors: { slug: "Slug must be unique." },
      };
    }

    if (input.id) {
      const { data: before } = await supabase
        .from("categories")
        .select("image")
        .eq("id", input.id)
        .maybeSingle();

      const { error } = await supabase.from("categories").update(payload).eq("id", input.id);
      if (error) {
        console.error("[categories] update failed:", error.message);
        return { ok: false, error: GENERIC_ERROR };
      }

      const previous = before?.image as string | null;
      if (previous && previous !== payload.image) {
        await removeStorageFiles([previous], BUCKETS.categories);
      }

      revalidatePath("/", "layout");
      return { ok: true, data: { id: input.id, slug: payload.slug } };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[categories] insert failed:", error.message);
      return { ok: false, error: GENERIC_ERROR };
    }

    revalidatePath("/", "layout");
    return { ok: true, data: { id: data.id as string, slug: payload.slug } };
  } catch (error) {
    console.error("[categories] unexpected error:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  try {
    const supabase = await createServerSupabaseClient();

    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (countError) return { ok: false, error: GENERIC_ERROR };

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `This category still has ${count} product${count === 1 ? "" : "s"}. Move them to another category first.`,
      };
    }

    const { data: category } = await supabase
      .from("categories")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("[categories] delete failed:", error.message);
      return { ok: false, error: "Unable to delete this category. Please try again." };
    }

    if (category?.image) await removeStorageFiles([category.image as string], BUCKETS.categories);

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[categories] unexpected error:", error);
    return { ok: false, error: "Unable to delete this category. Please try again." };
  }
}

export async function setCategoryActive(id: string, value: boolean): Promise<ActionResult> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("categories").update({ active: value }).eq("id", id);
    if (error) {
      console.error("[categories] flag update failed:", error.message);
      return { ok: false, error: "Unable to update this category. Please try again." };
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[categories] unexpected error:", error);
    return { ok: false, error: "Unable to update this category. Please try again." };
  }
}
