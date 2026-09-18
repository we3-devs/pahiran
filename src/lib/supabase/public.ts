import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Public, cookie-less client for reading the public catalogue.
 *
 * RLS restricts it to active products/categories and public store settings, so
 * it is safe to use for every storefront read. Because it does not touch
 * cookies it can be used inside cached functions.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
