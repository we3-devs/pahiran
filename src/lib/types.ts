/** Domain types mirroring the Supabase schema (see `supabase/schema.sql`). */

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  /** Optional original price; when higher than `price` the card shows a sale badge. */
  compare_at_price: number | null;
  category_id: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  /** Populated by joined reads (product detail, admin tables). */
  category?: Pick<Category, "id" | "name" | "slug"> | null;
};

/** A product row plus its category, as returned by the storefront queries. */
export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
};

export type StoreSettings = {
  id: number;

  store_name: string;
  logo: string | null;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  whatsapp_country_code: string;

  currency_code: string;
  currency_symbol: string;
  brand_color: string;

  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;

  hero_enabled: boolean;
  hero_label: string | null;
  hero_show_label: boolean;
  hero_title: string | null;
  hero_description: string | null;
  hero_image: string | null;
  hero_show_image: boolean;
  hero_primary_button_text: string | null;
  hero_primary_button_link: string | null;
  hero_secondary_button_text: string | null;
  hero_secondary_button_link: string | null;
  hero_show_secondary_button: boolean;

  categories_heading: string;
  categories_description: string | null;
  featured_enabled: boolean;
  featured_heading: string;
  featured_description: string | null;
  featured_count: number;

  about_enabled: boolean;
  about_heading: string | null;
  about_description: string | null;
  about_body: string | null;
  about_image: string | null;

  promo_enabled: boolean;
  promo_heading: string | null;
  promo_text: string | null;
  promo_button_text: string | null;
  promo_button_link: string | null;
  promo_image: string | null;

  contact_title: string;
  contact_description: string | null;
  business_hours: string | null;

  footer_description: string | null;
  copyright_text: string | null;

  seo_title: string | null;
  seo_description: string | null;

  updated_at: string;
};

export type CartItem = {
  /** Stable identity: product + chosen options. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
};

export type CheckoutDetails = {
  fullName: string;
  phone: string;
  address: string;
  note: string;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
