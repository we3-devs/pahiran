"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-guard";
import { BUCKETS } from "@/lib/env";
import { removeStorageFiles } from "@/lib/storage-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeHexColor } from "@/lib/theme";
import type { ActionResult, StoreSettings } from "@/lib/types";
import { hasErrors, type FieldErrors } from "@/lib/validation";

export type SettingsFormValues = Omit<StoreSettings, "id" | "updated_at" | "featured_count"> & {
  featured_count: string | number;
};

const GENERIC_ERROR = "Unable to save changes. Please try again.";

/** Image fields live in `store-assets`; replaced files are cleaned up. */
const IMAGE_FIELDS = ["logo", "hero_image", "about_image", "promo_image"] as const;

const LINK_FIELDS = [
  "hero_primary_button_link",
  "hero_secondary_button_link",
  "promo_button_link",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
] as const;

function validateSettings(input: SettingsFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.store_name?.trim()) errors.store_name = "Store name is required.";

  if (input.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (input.whatsapp?.trim() && input.whatsapp.replace(/\D/g, "").length < 7) {
    errors.whatsapp = "Enter the full WhatsApp number, including the area code.";
  }

  if (input.whatsapp_country_code?.trim() && !/^\d{1,4}$/.test(input.whatsapp_country_code.trim())) {
    errors.whatsapp_country_code = "Country code should be 1–4 digits (e.g. 977).";
  }

  if (input.brand_color?.trim() && !/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(input.brand_color.trim())) {
    errors.brand_color = "Enter a hex colour such as #1c4b3c.";
  }

  const featuredCount = Number(input.featured_count);
  if (!Number.isInteger(featuredCount) || featuredCount < 1 || featuredCount > 12) {
    errors.featured_count = "Choose a number between 1 and 12.";
  }

  LINK_FIELDS.forEach((field) => {
    const value = input[field];
    if (!value?.trim()) return;
    if (!value.startsWith("/") && !/^https?:\/\//.test(value.trim())) {
      errors[field] = "Use a link starting with / or https://.";
    }
  });

  if (input.seo_title && input.seo_title.length > 70) {
    errors.seo_title = "Keep the SEO title under 70 characters.";
  }
  if (input.seo_description && input.seo_description.length > 180) {
    errors.seo_description = "Keep the SEO description under 180 characters.";
  }

  return errors;
}

export async function saveSettings(input: SettingsFormValues): Promise<ActionResult> {
  const guard = await requireAdminSession();
  if (!guard.ok) return { ok: false, error: guard.error };

  const fieldErrors = validateSettings(input);
  if (hasErrors(fieldErrors)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const text = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  const payload = {
    ...input,
    id: 1,
    store_name: input.store_name.trim(),
    logo: text(input.logo),
    tagline: text(input.tagline),
    description: text(input.description),
    address: text(input.address),
    phone: text(input.phone),
    email: text(input.email),
    whatsapp: text(input.whatsapp),
    whatsapp_country_code: input.whatsapp_country_code?.trim() || "977",
    currency_code: input.currency_code?.trim() || "NPR",
    currency_symbol: input.currency_symbol?.trim() || "Rs.",
    brand_color: normalizeHexColor(input.brand_color),
    hero_label: text(input.hero_label),
    hero_title: text(input.hero_title),
    hero_description: text(input.hero_description),
    hero_image: text(input.hero_image),
    hero_primary_button_text: text(input.hero_primary_button_text),
    hero_primary_button_link: text(input.hero_primary_button_link),
    hero_secondary_button_text: text(input.hero_secondary_button_text),
    hero_secondary_button_link: text(input.hero_secondary_button_link),
    featured_count: Number(input.featured_count),
    promo_heading: text(input.promo_heading),
    promo_text: text(input.promo_text),
    promo_button_text: text(input.promo_button_text),
    promo_button_link: text(input.promo_button_link),
    promo_image: text(input.promo_image),
    footer_description: text(input.footer_description),
    copyright_text: text(input.copyright_text),
    seo_title: text(input.seo_title),
    seo_description: text(input.seo_description),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await createServerSupabaseClient();

    const { data: before } = await supabase
      .from("store_settings")
      .select(IMAGE_FIELDS.join(", "))
      .eq("id", 1)
      .maybeSingle();

    const { error } = await supabase.from("store_settings").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[settings] save failed:", error.message);
      return { ok: false, error: GENERIC_ERROR };
    }

    const replaced = IMAGE_FIELDS.map((field) => (before as Record<string, string | null> | null)?.[field])
      .filter((url): url is string => Boolean(url))
      .filter((url) => !IMAGE_FIELDS.some((field) => payload[field] === url));

    if (replaced.length > 0) await removeStorageFiles(replaced, BUCKETS.assets);

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[settings] unexpected error:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
