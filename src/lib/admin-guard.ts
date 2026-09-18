import { isSupabaseConfigured } from "@/lib/env";
import { getAdminUser } from "@/lib/supabase/server";

export type GuardResult = { ok: true } | { ok: false; error: string };

/**
 * Every admin mutation calls this first. RLS is the real gate, but this gives
 * the UI a friendly message instead of a raw database error.
 */
export async function requireAdminSession(): Promise<GuardResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Supabase is not configured yet. Add your project keys to .env.local.",
    };
  }

  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };

  return { ok: true };
}
