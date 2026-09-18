import type { Category, Product, StoreSettings } from "@/lib/types";

/**
 * Fallback content.
 *
 * - `NEUTRAL_SETTINGS` provides sensible fallbacks for columns that are empty
 *   in the database, so the site never renders `undefined`.
 * - `DEMO_*` data is only used when Supabase environment variables are missing
 *   (fresh clone / preview). Once Supabase is configured, all content comes
 *   from the database. The same content ships in `supabase/seed.sql` so a new
 *   project starts with a browsable catalogue.
 */

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const NEUTRAL_SETTINGS: StoreSettings = {
  id: 1,

  store_name: "Your Store",
  logo: null,
  tagline: null,
  description: null,
  address: null,
  phone: null,
  email: null,
  whatsapp: null,
  whatsapp_country_code: "977",

  currency_code: "NPR",
  currency_symbol: "Rs.",
  brand_color: "#1c4b3c",

  facebook: null,
  instagram: null,
  tiktok: null,
  youtube: null,

  hero_enabled: true,
  hero_label: null,
  hero_show_label: true,
  hero_title: "Modern fashion for everyday confidence.",
  hero_description: null,
  hero_image: null,
  hero_show_image: true,
  hero_primary_button_text: "Shop Collection",
  hero_primary_button_link: "/shop",
  hero_secondary_button_text: null,
  hero_secondary_button_link: null,
  hero_show_secondary_button: false,

  categories_heading: "Shop by Category",
  categories_description: null,
  featured_enabled: true,
  featured_heading: "Featured Collection",
  featured_description: null,
  featured_count: 4,

  about_enabled: true,
  about_heading: null,
  about_description: null,
  about_body: null,
  about_image: null,

  promo_enabled: false,
  promo_heading: null,
  promo_text: null,
  promo_button_text: null,
  promo_button_link: null,
  promo_image: null,

  contact_title: "Get in touch",
  contact_description: null,
  business_hours: null,

  footer_description: null,
  copyright_text: null,

  seo_title: null,
  seo_description: null,

  updated_at: daysAgo(0),
};

export const DEMO_CATEGORIES: Category[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Men",
    slug: "men",
    description: "Everyday essentials and elevated basics for men.",
    image: img("1521572163474-6864f9cf17ab"),
    active: true,
    sort_order: 1,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Women",
    slug: "women",
    description: "Soft silhouettes, natural fabrics, effortless style.",
    image: img("1503342217505-b0a15ec3261c"),
    active: true,
    sort_order: 2,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Kids",
    slug: "kids",
    description: "Comfortable, durable pieces made for play.",
    image: img("1567401893414-76b7b1e5a7a5"),
    active: true,
    sort_order: 3,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Accessories",
    slug: "accessories",
    description: "Finishing touches that complete the look.",
    image: img("1571945153237-4929e783af4a"),
    active: true,
    sort_order: 4,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
  },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "55555555-5555-4555-8555-555555555501",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-t-shirt",
    description:
      "A heavyweight 240 GSM combed cotton tee with a clean, structured drape. Pre-shrunk and garment washed so it keeps its shape after every wear.",
    price: 1200,
    compare_at_price: null,
    category_id: "11111111-1111-4111-8111-111111111111",
    images: [img("1576566588028-4147f3842f27"), img("1521572163474-6864f9cf17ab")],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    featured: true,
    active: true,
    created_at: daysAgo(6),
    updated_at: daysAgo(6),
  },
  {
    id: "55555555-5555-4555-8555-555555555502",
    name: "Classic Denim Jeans",
    slug: "classic-denim-jeans",
    description:
      "Mid-rise straight leg jeans in rigid Japanese-style denim with a hint of stretch for comfort. Finished with a clean tonal stitch.",
    price: 2500,
    compare_at_price: null,
    category_id: "11111111-1111-4111-8111-111111111111",
    images: [img("1541099649105-f69ad21f3246"), img("1542272604-787c3835535d")],
    sizes: ["30", "32", "34", "36"],
    colors: ["Blue", "Black"],
    featured: true,
    active: true,
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  },
  {
    id: "55555555-5555-4555-8555-555555555503",
    name: "Oversized Linen Shirt",
    slug: "oversized-linen-shirt",
    description:
      "Breathable European linen cut for an easy, oversized fit. Wear it buttoned for work or open over a tee on warm afternoons.",
    price: 1899,
    compare_at_price: 2399,
    category_id: "11111111-1111-4111-8111-111111111111",
    images: [img("1596755094514-f87e34085b2c"), img("1594633312681-425c7b97ccd1")],
    sizes: ["M", "L", "XL"],
    colors: ["White", "Beige"],
    featured: true,
    active: true,
    created_at: daysAgo(12),
    updated_at: daysAgo(12),
  },
  {
    id: "55555555-5555-4555-8555-555555555504",
    name: "Everyday Cotton Kurti",
    slug: "everyday-cotton-kurti",
    description:
      "A soft cotton kurti with a relaxed A-line shape and side slits. Designed to move easily between work and weekend.",
    price: 1650,
    compare_at_price: null,
    category_id: "22222222-2222-4222-8222-222222222222",
    images: [img("1515372039744-b8f02a3ae446"), img("1523381210434-271e8be1f52b")],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Rust", "Teal"],
    featured: true,
    active: true,
    created_at: daysAgo(4),
    updated_at: daysAgo(4),
  },
  {
    id: "55555555-5555-4555-8555-555555555505",
    name: "Floral Summer Dress",
    slug: "floral-summer-dress",
    description:
      "A lightweight midi dress with a subtle print, lined bodice and adjustable straps. Cool, easy and endlessly wearable.",
    price: 2799,
    compare_at_price: null,
    category_id: "22222222-2222-4222-8222-222222222222",
    images: [img("1595777457583-95e059d581b8")],
    sizes: ["S", "M", "L"],
    colors: ["Blue", "White"],
    featured: true,
    active: true,
    created_at: daysAgo(25),
    updated_at: daysAgo(25),
  },
  {
    id: "55555555-5555-4555-8555-555555555506",
    name: "Wool Blend Coat",
    slug: "wool-blend-coat",
    description:
      "A tailored wool blend coat with dropped shoulders and a full satin lining. Warm without the bulk.",
    price: 5400,
    compare_at_price: 6500,
    category_id: "22222222-2222-4222-8222-222222222222",
    images: [img("1441984904996-e0b6ba687e04")],
    sizes: ["S", "M", "L"],
    colors: ["Camel", "Black"],
    featured: false,
    active: true,
    created_at: daysAgo(60),
    updated_at: daysAgo(60),
  },
  {
    id: "55555555-5555-4555-8555-555555555507",
    name: "Kids Cotton Hoodie",
    slug: "kids-cotton-hoodie",
    description:
      "Brushed fleece hoodie with a kangaroo pocket and a soft lined hood. Machine washable and built for everyday play.",
    price: 1450,
    compare_at_price: null,
    category_id: "33333333-3333-4333-8333-333333333333",
    images: [img("1523381210434-271e8be1f52b")],
    sizes: ["4", "6", "8", "10"],
    colors: ["Grey", "Navy"],
    featured: false,
    active: true,
    created_at: daysAgo(18),
    updated_at: daysAgo(18),
  },
  {
    id: "55555555-5555-4555-8555-555555555508",
    name: "Canvas Tote Bag",
    slug: "canvas-tote-bag",
    description:
      "Heavy canvas tote with reinforced handles and an inner pocket. Roomy enough for the market or a laptop.",
    price: 950,
    compare_at_price: null,
    category_id: "44444444-4444-4444-8444-444444444444",
    images: [img("1553062407-98eeb64c6a62")],
    sizes: [],
    colors: ["Natural", "Black"],
    featured: false,
    active: true,
    created_at: daysAgo(9),
    updated_at: daysAgo(9),
  },
  {
    id: "55555555-5555-4555-8555-555555555509",
    name: "Leather Belt",
    slug: "leather-belt",
    description:
      "Full-grain leather belt with a brushed metal buckle. Ages beautifully with wear.",
    price: 1250,
    compare_at_price: null,
    category_id: "44444444-4444-4444-8444-444444444444",
    images: [img("1489987707025-afc232f7ea0f")],
    sizes: ["32", "34", "36"],
    colors: ["Brown", "Black"],
    featured: false,
    active: true,
    created_at: daysAgo(70),
    updated_at: daysAgo(70),
  },
];

export const DEMO_SETTINGS: StoreSettings = {
  ...NEUTRAL_SETTINGS,
  store_name: "Aangan",
  tagline: "Clothing for everyday",
  description:
    "A small clothing studio in eastern Nepal making honest, well-cut pieces in natural fabrics — designed to be worn often and kept for years.",
  address: "Main Road, Birtamode, Jhapa, Nepal",
  phone: "+977 98-0000-0000",
  email: "hello@aangan.example",
  whatsapp: "9800000000",
  whatsapp_country_code: "977",

  hero_enabled: true,
  hero_label: "New Season 2026",
  hero_title: "Modern fashion for everyday confidence.",
  hero_description:
    "Thoughtfully made clothing in natural fabrics — comfortable fits, honest prices, and pieces you will actually reach for.",
  hero_image: img("1441986300917-64674bd600d8"),
  hero_primary_button_text: "Shop Collection",
  hero_primary_button_link: "/shop",
  hero_secondary_button_text: "Our Story",
  hero_secondary_button_link: "/about",
  hero_show_secondary_button: true,

  categories_heading: "Shop by Category",
  categories_description: "Four small collections, updated every season.",
  featured_heading: "Featured Collection",
  featured_description: "A few pieces we are proudest of right now.",
  featured_count: 4,

  about_enabled: true,
  about_heading: "Made to be worn, not replaced",
  about_description:
    "We design a small number of styles each season and make them properly.",
  about_body:
    "Aangan started in 2019 with a simple idea: clothing should be comfortable, fairly priced and made to last more than one season.\n\nWe work with a handful of small workshops around Jhapa, choosing natural fabrics — cotton, linen, wool — and keeping our range deliberately short so we can focus on fit and finish.",
  about_image: img("1441984904996-e0b6ba687e04"),

  promo_enabled: true,
  promo_heading: "Free delivery inside Birtamode",
  promo_text:
    "Order over Rs. 3,000 and we will drop it at your door, free. Everywhere else in Nepal ships within two days.",
  promo_button_text: "Start shopping",
  promo_button_link: "/shop",
  promo_image: img("1523381210434-271e8be1f52b"),

  contact_title: "Visit the studio",
  contact_description:
    "Questions about sizing, fabric or delivery? Message us on WhatsApp — we usually reply within an hour during business hours.",
  business_hours: "Sunday – Friday, 10:00 – 19:00",

  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  tiktok: null,
  youtube: null,

  footer_description:
    "Honest clothing in natural fabrics, made in small batches in eastern Nepal.",
  copyright_text: "Aangan. All rights reserved.",

  seo_title: "Aangan — modern clothing for everyday confidence",
  seo_description:
    "Shop thoughtfully made clothing for men, women and kids. Order on WhatsApp with delivery across Nepal.",
};
