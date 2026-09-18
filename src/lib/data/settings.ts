import { cache } from "react";

import { DEMO_SETTINGS, NEUTRAL_SETTINGS } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { StoreSettings } from "@/lib/types";

/**
 * Single settings row (`id = 1`), merged over neutral fallbacks so a partially
 * filled row never renders blanks. Demo content is used only when Supabase is
 * not configured yet.
 *
 * Caching strategy: pages are statically rendered with ISR (see the `revalidate`
 * export in each storefront page) and admin mutations call `revalidatePath`,
 * so an owner's edit is visible on the next request. `cache()` dedupes the read
 * across the header, footer and page in a single render.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  if (!isSupabaseConfigured()) return DEMO_SETTINGS;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[settings] failed to load store settings:", error.message);
      return NEUTRAL_SETTINGS;
    }
    if (!data) return NEUTRAL_SETTINGS;

    return { ...NEUTRAL_SETTINGS, ...data } as StoreSettings;
  } catch (error) {
    console.error("[settings] unexpected error:", error);
    return NEUTRAL_SETTINGS;
  }
});
