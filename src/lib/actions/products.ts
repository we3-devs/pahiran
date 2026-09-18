"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-guard";
import { slugify } from "@/lib/format";
import { removeStorageFiles } from "@/lib/storage-server";
import { BUCKETS } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { hasErrors, parseAmount, validateProduct, type ProductInput } from "@/lib/validation";

export type ProductFormValues = ProductInput & { id?: string | null };

const GENERIC_ERROR = "Unable to save changes. Please try again.";

function buildPayload(input: ProductFormValues) {
  return {
    name: input.name.trim(),
    slug: slugify(input.slug),
    description: input.description.trim() || null,
    price: parseAmount(input.price) ?? 0,
    compare_at_price: input.compareAtPrice.trim() ? parseAmount(input.compareAtPrice) : null,
    category_id: input.categoryId,
    images: input.images,
    sizes: input.sizes,
    colors: input.colors,
    featured: input.featured,
    active: input.active,
  };
}

export async function saveProduct(
  input: ProductFormValues,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  const fieldErrors = validateProduct(input);
  if (hasErrors(fieldErrors)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const payload = buildPayload(input);

  try {
    const supabase = await createServerSupabaseClient();

    const { data: clash, error: lookupError } = await supabase
      .from("products")
      .select("id")
      .eq("slug", payload.slug)
      .maybeSingle();

    if (lookupError) return { ok: false, error: GENERIC_ERROR };
    if (clash && clash.id !== input.id) {
      return {
        ok: false,
        error: "That slug is already used by another product.",
        fieldErrors: { slug: "Slug must be unique." },
      };
    }

    if (input.id) {
      const { data: before } = await supabase
        .from("products")
        .select("images")
        .eq("id", input.id)
        .maybeSingle();

      const { error } = await supabase.from("products").update(payload).eq("id", input.id);
      if (error) {
        console.error("[products] update failed:", error.message);
        return { ok: false, error: GENERIC_ERROR };
      }

      // Clean up images the form no longer references (this product only).
      const previous = (before?.images ?? []) as string[];
      const removed = previous.filter((url) => !payload.images.includes(url));
      if (removed.length > 0) await removeStorageFiles(removed, BUCKETS.products);

      revalidatePath("/", "layout");
      return { ok: true, data: { id: input.id, slug: payload.slug } };
    }

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[products] insert failed:", error.message);
      return { ok: false, error: GENERIC_ERROR };
    }

    revalidatePath("/", "layout");
    return { ok: true, data: { id: data.id as string, slug: payload.slug } };
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: product } = await supabase
      .from("products")
      .select("images")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("[products] delete failed:", error.message);
      return { ok: false, error: "Unable to delete this product. Please try again." };
    }

    // Only the images that belonged to this product are removed.
    await removeStorageFiles((product?.images ?? []) as string[], BUCKETS.products);

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return { ok: false, error: "Unable to delete this product. Please try again." };
  }
}

export async function setProductFlag(
  id: string,
  field: "active" | "featured",
  value: boolean,
): Promise<ActionResult> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("products")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      console.error("[products] flag update failed:", error.message);
      return { ok: false, error: "Unable to update this product. Please try again." };
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[products] unexpected error:", error);
    return { ok: false, error: "Unable to update this product. Please try again." };
  }
}
