# Clothing store — catalogue, cart and WhatsApp checkout

A small, production-ready storefront plus an admin panel for a clothing shop.

- **Customers** browse the catalogue, filter categories, pick size/colour, keep a cart and send
  their order to the shop's WhatsApp number.
- **The owner** manages products, categories and every piece of website content from `/admin`.
- **There is no order management**: orders exist only as WhatsApp messages. No payments, no
  customer accounts, no CRM.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Zustand and Supabase
(PostgreSQL + Auth + Storage).

---

## 1. Quick start (demo mode)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Without Supabase credentials the site runs on a bundled demo
catalogue (`src/lib/demo-data.ts`) so you can click through everything — browsing, cart, checkout
message generation — and the admin panel shows a setup notice.

## 2. Connect Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   NEXT_PUBLIC_SITE_URL=https://your-domain.com   # used for canonical URLs, sitemap, Open Graph
   ```

   The **service-role key is never used** by this app and must never be added to a `NEXT_PUBLIC_*`
   variable.

3. Run the SQL:
   - `supabase/schema.sql` — tables, indexes, triggers, RLS policies and the three storage buckets.
   - `supabase/seed.sql` — optional sample catalogue and store content.

4. Create the admin user: **Authentication → Users → Add user** (email + password). Turn off
   public sign-ups in **Authentication → Providers → Email** so only accounts you create can sign
   in. Every authenticated user is treated as a store admin — keep the user list to people who
   should have full access.

5. Restart the dev server and sign in at `/admin/login`. Real content now replaces the demo data.

## 3. What the owner can change

Everything customer-facing lives in the `store_settings` row and is editable at `/admin/settings`:

| Area | Editable |
| --- | --- |
| Store information | Name, logo, tagline, description, address, phone, email, **WhatsApp number + country code**, business hours |
| Appearance | Brand accent colour (drives buttons, badges, focus rings), currency code and symbol |
| Hero | Show/hide, label, heading, description, image, show/hide image, primary + secondary buttons |
| Homepage | Category heading/description, featured heading/description/count, about section, promotional band (heading, text, button, image) |
| Contact section | Heading, description |
| Footer | Description, copyright text |
| Social media | Facebook, Instagram, TikTok, YouTube |
| SEO | SEO title and description |

Products and categories are managed at `/admin/products` and `/admin/categories`. Nothing that the
shop is expected to change regularly is hardcoded; code-level fallbacks exist only so the site
still renders before Supabase is configured.

## 4. Routes

**Storefront**

```
/                     hero, categories, featured collection, promo, about
/shop                 all products, search, category filter, sorting, pagination
/category/[slug]      one category
/product/[slug]       gallery, size/colour/quantity, add to cart, related products
/cart                 quantities, remove, totals (persisted in localStorage)
/checkout             customer details + "Order via WhatsApp"
/about  /contact      store content from settings
/sitemap.xml  /robots.txt
```

**Admin** (`/admin` and everything below it is protected)

```
/admin/login          Supabase email + password sign-in
/admin                dashboard: counts, quick actions, setup checklist
/admin/products       list, search/filter, inline active/featured toggles, delete with confirmation
/admin/products/new   add product
/admin/products/[id]  edit product (same form component)
/admin/categories     add/edit/delete, image, order, activate/deactivate
/admin/settings       the content editor above
```

## 5. How ordering works

1. The cart is client-side only (`Zustand` + `localStorage`) — it survives refreshes and is never
   written to the database.
2. Checkout collects **name, phone, address and an optional note**, validated in the browser and
   again on the server.
3. `src/lib/whatsapp.ts` builds a formatted message (customer details, each item with size, colour,
   quantity, unit price and subtotal, then the total and note) and opens
   `https://wa.me/<number>?text=<encoded message>`.
4. The number comes from `store_settings`, is stripped of spaces/dashes and gets the configured
   country code prefixed when needed.
5. The customer presses **Send** in WhatsApp. If the browser blocks the popup, the page shows a
   fallback link instead of losing the order, and the cart is only cleared once WhatsApp opened.

## 6. Security model

- Public (anon) can **read** active products, active categories and store settings, and read files
  in the public storage buckets. It cannot write anything.
- Authenticated users can manage products, categories and settings (RLS policies in
  `supabase/schema.sql`), and upload/replace/delete files in `product-images`,
  `category-images` and `store-assets`.
- `src/proxy.ts` refreshes the session and redirects anonymous visitors from `/admin/*`; the admin
  layout re-checks the session so no admin markup is rendered without one.
- Product/category deletion removes only the images referenced by that record — the storage helper
  resolves paths inside the expected bucket and ignores anything else.
- Deleting a category that still has products is blocked (in the UI and by a `restrict` foreign
  key) so products can never be orphaned by accident.

## 7. Performance & SEO

- Server components everywhere except the interactive parts (cart, gallery, forms, uploaders).
- Static rendering with 5-minute ISR for the storefront; admin edits call `revalidatePath`, so
  changes appear on the next request without a redeploy.
- `next/image` with responsive `sizes`, AVIF/WebP, lazy loading by default and eager loading only
  for the hero and product gallery.
- Unique titles, descriptions, canonicals, Open Graph and Twitter metadata per page; JSON-LD for
  the store, products, categories and breadcrumbs; `sitemap.xml` and `robots.txt`.
- Known trade-off: a missing product/category renders the “not found” page with a `200` status and
  an injected `robots: noindex` (Next.js streams the response before `notFound()` can change the
  status). Google does not index those URLs. If a hard `404` is ever required, check the slug in
  `src/proxy.ts` and rewrite to a not-found route.

## 8. Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint (Next.js config)
npm run typecheck  # tsc --noEmit
```

## 9. Deploying to Vercel

1. Push the repository and import it in Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL`
   (the production URL) as environment variables for all environments.
3. Deploy. `next.config.ts` automatically allow-lists your Supabase host (`*.supabase.co`) for
   `next/image`; the temporary Unsplash URLs used by the sample seed data are allow-listed too and
   can be removed once real product photos are uploaded.

## 10. Project layout

```
src/
  app/
    (store)/            storefront routes (header, footer, toasts)
    admin/              login + protected dashboard routes
    sitemap.ts robots.ts
  components/
    store/              navbar, hero, cards, gallery, cart, checkout
    admin/              sidebar, tables, forms, uploader, dialogs
    ui/                 button, inputs, dialog, switch, toast, misc primitives
  lib/
    actions/            server actions (products, categories, settings, auth)
    cart/               Zustand cart store
    data/               storefront + admin queries
    supabase/           browser, server and public clients
    whatsapp.ts         order message + wa.me link
    validation.ts       shared form validation
supabase/
  schema.sql seed.sql
```
