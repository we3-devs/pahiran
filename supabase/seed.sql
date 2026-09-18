-- ============================================================================
--  Sample content — optional
--  Run after schema.sql to start with a browsable catalogue.
--  Every row below can be edited or deleted from the admin panel.
-- ============================================================================

insert into public.categories (id, name, slug, description, image, active, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Men', 'men',
   'Everyday essentials and elevated basics for men.',
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80', true, 1),
  ('22222222-2222-4222-8222-222222222222', 'Women', 'women',
   'Soft silhouettes, natural fabrics, effortless style.',
   'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80', true, 2),
  ('33333333-3333-4333-8333-333333333333', 'Kids', 'kids',
   'Comfortable, durable pieces made for play.',
   'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80', true, 3),
  ('44444444-4444-4444-8444-444444444444', 'Accessories', 'accessories',
   'Finishing touches that complete the look.',
   'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=1200&q=80', true, 4)
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      image = excluded.image,
      active = excluded.active,
      sort_order = excluded.sort_order;

insert into public.products
  (id, name, slug, description, price, compare_at_price, category_id,
   images, sizes, colors, featured, active)
values
  ('55555555-5555-4555-8555-555555555501', 'Premium Cotton T-Shirt', 'premium-cotton-t-shirt',
   'A heavyweight 240 GSM combed cotton tee with a clean, structured drape. Pre-shrunk and garment washed so it keeps its shape after every wear.',
   1200, null, '11111111-1111-4111-8111-111111111111',
   array['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'],
   array['S','M','L','XL'], array['Black','White'], true, true),

  ('55555555-5555-4555-8555-555555555502', 'Classic Denim Jeans', 'classic-denim-jeans',
   'Mid-rise straight leg jeans in rigid Japanese-style denim with a hint of stretch for comfort. Finished with a clean tonal stitch.',
   2500, null, '11111111-1111-4111-8111-111111111111',
   array['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
         'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80'],
   array['30','32','34','36'], array['Blue','Black'], true, true),

  ('55555555-5555-4555-8555-555555555503', 'Oversized Linen Shirt', 'oversized-linen-shirt',
   'Breathable European linen cut for an easy, oversized fit. Wear it buttoned for work or open over a tee on warm afternoons.',
   1899, 2399, '11111111-1111-4111-8111-111111111111',
   array['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
         'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80'],
   array['M','L','XL'], array['White','Beige'], true, true),

  ('55555555-5555-4555-8555-555555555504', 'Everyday Cotton Kurti', 'everyday-cotton-kurti',
   'A soft cotton kurti with a relaxed A-line shape and side slits. Designed to move easily between work and weekend.',
   1650, null, '22222222-2222-4222-8222-222222222222',
   array['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80',
         'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80'],
   array['S','M','L','XL'], array['Black','Rust','Teal'], true, true),

  ('55555555-5555-4555-8555-555555555505', 'Floral Summer Dress', 'floral-summer-dress',
   'A lightweight midi dress with a subtle print, lined bodice and adjustable straps. Cool, easy and endlessly wearable.',
   2799, null, '22222222-2222-4222-8222-222222222222',
   array['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=80'],
   array['S','M','L'], array['Blue','White'], true, true),

  ('55555555-5555-4555-8555-555555555506', 'Wool Blend Coat', 'wool-blend-coat',
   'A tailored wool blend coat with dropped shoulders and a full satin lining. Warm without the bulk.',
   5400, 6500, '22222222-2222-4222-8222-222222222222',
   array['https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80'],
   array['S','M','L'], array['Camel','Black'], false, true),

  ('55555555-5555-4555-8555-555555555507', 'Kids Cotton Hoodie', 'kids-cotton-hoodie',
   'Brushed fleece hoodie with a kangaroo pocket and a soft lined hood. Machine washable and built for everyday play.',
   1450, null, '33333333-3333-4333-8333-333333333333',
   array['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80'],
   array['4','6','8','10'], array['Grey','Navy'], false, true),

  ('55555555-5555-4555-8555-555555555508', 'Canvas Tote Bag', 'canvas-tote-bag',
   'Heavy canvas tote with reinforced handles and an inner pocket. Roomy enough for the market or a laptop.',
   950, null, '44444444-4444-4444-8444-444444444444',
   array['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80'],
   array[]::text[], array['Natural','Black'], false, true),

  ('55555555-5555-4555-8555-555555555509', 'Leather Belt', 'leather-belt',
   'Full-grain leather belt with a brushed metal buckle. Ages beautifully with wear.',
   1250, null, '44444444-4444-4444-8444-444444444444',
   array['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80'],
   array['32','34','36'], array['Brown','Black'], false, true)
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      price = excluded.price,
      compare_at_price = excluded.compare_at_price,
      category_id = excluded.category_id,
      images = excluded.images,
      sizes = excluded.sizes,
      colors = excluded.colors,
      featured = excluded.featured,
      active = excluded.active;

-- Store front content for the single settings row.
update public.store_settings set
  store_name = 'Aangan',
  tagline = 'Clothing for everyday',
  description = 'A small clothing studio in eastern Nepal making honest, well-cut pieces in natural fabrics — designed to be worn often and kept for years.',
  address = 'Main Road, Birtamode, Jhapa, Nepal',
  phone = '+977 98-0000-0000',
  email = 'hello@aangan.example',
  whatsapp = '9800000000',
  whatsapp_country_code = '977',
  currency_code = 'NPR',
  currency_symbol = 'Rs.',
  brand_color = '#1c4b3c',

  facebook = 'https://facebook.com',
  instagram = 'https://instagram.com',

  hero_enabled = true,
  hero_label = 'New Season 2026',
  hero_title = 'Modern fashion for everyday confidence.',
  hero_description = 'Thoughtfully made clothing in natural fabrics — comfortable fits, honest prices, and pieces you will actually reach for.',
  hero_image = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  hero_primary_button_text = 'Shop Collection',
  hero_primary_button_link = '/shop',
  hero_secondary_button_text = 'Our Story',
  hero_secondary_button_link = '/about',
  hero_show_secondary_button = true,

  categories_heading = 'Shop by Category',
  categories_description = 'Four small collections, updated every season.',
  featured_heading = 'Featured Collection',
  featured_description = 'A few pieces we are proudest of right now.',
  featured_count = 4,
  about_heading = 'Made to be worn, not replaced',
  about_description = 'We design a small number of styles each season and make them properly.',
  about_body = 'Aangan started in 2019 with a simple idea: clothing should be comfortable, fairly priced and made to last more than one season.'
    || E'\n\n' ||
    'We work with a handful of small workshops around Jhapa, choosing natural fabrics — cotton, linen, wool — and keeping our range deliberately short so we can focus on fit and finish.',
  about_image = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80',
  promo_enabled = true,
  promo_heading = 'Free delivery inside Birtamode',
  promo_text = 'Order over Rs. 3,000 and we will drop it at your door, free. Everywhere else in Nepal ships within two days.',
  promo_button_text = 'Start shopping',
  promo_button_link = '/shop',
  promo_image = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',

  contact_title = 'Visit the studio',
  contact_description = 'Questions about sizing, fabric or delivery? Message us on WhatsApp — we usually reply within an hour during business hours.',
  business_hours = 'Sunday – Friday, 10:00 – 19:00',

  footer_description = 'Honest clothing in natural fabrics, made in small batches in eastern Nepal.',
  copyright_text = 'Aangan. All rights reserved.',
  seo_title = 'Aangan — modern clothing for everyday confidence',
  seo_description = 'Shop thoughtfully made clothing for men, women and kids. Order on WhatsApp with delivery across Nepal.'
where id = 1;
