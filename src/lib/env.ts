/**
 * Environment access.
 *
 * The storefront is designed to degrade gracefully: when Supabase environment
 * variables are absent (for example a fresh clone before setup) the app renders
 * the bundled demo catalogue instead of crashing. The admin panel requires real
 * credentials and shows a setup notice otherwise.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when the Supabase project credentials are present. */
export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith("http") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_URL.includes("your-project-ref")
  );
}

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

/** Storage buckets used by the admin panel. */
export const BUCKETS = {
  products: "product-images",
  categories: "category-images",
  assets: "store-assets",
} as const;
