-- ============================================================================
--  Store schema: products + categories + store settings
--  Run this once in the Supabase SQL editor (or with `supabase db push`).
--  Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at accurate
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image       text,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_active_idx on public.categories (active);
create index if not exists categories_sort_idx on public.categories (sort_order);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  price            numeric(12,2) not null check (price >= 0),
  -- Optional original price. When higher than `price` the storefront shows a
  -- sale badge and a struck-through price.
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  category_id      uuid references public.categories (id) on delete restrict,
  images           text[] not null default '{}',
  sizes            text[] not null default '{}',
  colors           text[] not null default '{}',
  featured         boolean not null default false,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_featured_idx on public.products (featured) where featured;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- store_settings (a single row, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),

  -- Store information
  store_name           text not null default 'Your Store',
  logo                 text,
  tagline              text,
  description          text,
  address              text,
  phone                text,
  email                text,
  whatsapp             text,
  whatsapp_country_code text not null default '977',

  -- Appearance / money
  currency_code        text not null default 'NPR',
  currency_symbol      text not null default 'Rs.',
  brand_color          text not null default '#1c4b3c',

  -- Social media
  facebook             text,
  instagram            text,
  tiktok               text,
  youtube              text,

  -- Hero section
  hero_enabled                  boolean not null default true,
  hero_label                    text,
  hero_show_label               boolean not null default true,
  hero_title                    text,
  hero_description              text,
  hero_image                    text,
  hero_show_image               boolean not null default true,
  hero_primary_button_text      text,
  hero_primary_button_link      text,
  hero_secondary_button_text    text,
  hero_secondary_button_link    text,
  hero_show_secondary_button    boolean not null default false,

  -- Homepage sections
  categories_heading       text not null default 'Shop by Category',
  categories_description   text,
  featured_enabled         boolean not null default true,
  featured_heading         text not null default 'Featured Collection',
  featured_description     text,
  featured_count           integer not null default 4,
  about_enabled            boolean not null default true,
  about_heading            text,
  about_description        text,
  about_body               text,
  about_image              text,
  promo_enabled            boolean not null default false,
  promo_heading            text,
  promo_text               text,
  promo_button_text        text,
  promo_button_link        text,
  promo_image              text,

  -- Contact section
  contact_title            text not null default 'Get in touch',
  contact_description      text,
  business_hours           text,

  -- Footer
  footer_description       text,
  copyright_text           text,

  -- SEO
  seo_title                text,
  seo_description          text,

  updated_at               timestamptz not null default now()
);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- Make sure the singleton row exists before the storefront queries it.
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * anon (customers): read active products, active categories, store settings
--   * authenticated (the store owner): full management access
--   * the service-role key is never used by the application
-- ---------------------------------------------------------------------------
alter table public.products       enable row level security;
alter table public.categories     enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
  on public.categories for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Public read store settings" on public.store_settings;
create policy "Public read store settings"
  on public.store_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings"
  on public.store_settings for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage buckets
--   * public read: product/category/store imagery is served to customers
--   * authenticated write: only signed-in admins can upload or delete
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',  'product-images',  true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('category-images', 'category-images', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('store-assets',    'store-assets',    true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read store images" on storage.objects;
create policy "Public read store images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('product-images', 'category-images', 'store-assets'));

drop policy if exists "Admins upload store images" on storage.objects;
create policy "Admins upload store images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('product-images', 'category-images', 'store-assets'));

drop policy if exists "Admins update store images" on storage.objects;
create policy "Admins update store images"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('product-images', 'category-images', 'store-assets'))
  with check (bucket_id in ('product-images', 'category-images', 'store-assets'));

drop policy if exists "Admins delete store images" on storage.objects;
create policy "Admins delete store images"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('product-images', 'category-images', 'store-assets'));
