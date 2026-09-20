-- XLIT catalog and reviews
-- Run this file in the Supabase SQL Editor before connecting the website.
-- Product, image, color, size, detail, and review order are stored explicitly.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  price_egp integer not null check (price_egp >= 0),
  collection text not null,
  stock_message text not null,
  rating numeric(2,1) not null check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  display_order integer not null unique check (display_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_path text not null,
  display_order integer not null check (display_order > 0),
  unique (product_id, display_order)
);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  display_order integer not null check (display_order > 0),
  unique (product_id, name),
  unique (product_id, display_order)
);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  display_order integer not null check (display_order > 0),
  unique (product_id, name),
  unique (product_id, display_order)
);

-- These keys lock every product to the same four sections currently used by products.ts.
create type public.product_detail_key as enum (
  'product_details',
  'size_chart',
  'washing_instructions',
  'delivery'
);

create table if not exists public.product_details (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  detail_key public.product_detail_key not null,
  title text not null,
  content text not null,
  display_order integer not null check (display_order between 1 and 4),
  unique (product_id, detail_key),
  unique (product_id, display_order)
);

create type public.review_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_name text not null check (char_length(reviewer_name) between 2 and 80),
  reviewer_email text check (reviewer_email is null or char_length(reviewer_email) <= 255),
  content text not null check (char_length(content) between 10 and 800),
  stars smallint not null check (stars between 1 and 5),
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists product_images_product_order_idx on public.product_images (product_id, display_order);
create index if not exists product_reviews_public_idx on public.product_reviews (product_id, status, created_at desc);

-- Visitors may only read active products and approved reviews.
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_details enable row level security;
alter table public.product_reviews enable row level security;

create policy "Public can read active products"
  on public.products for select using (is_active = true);
create policy "Public can read images for active products"
  on public.product_images for select using (
    exists (select 1 from public.products where products.id = product_images.product_id and products.is_active = true)
  );
create policy "Public can read colors for active products"
  on public.product_colors for select using (
    exists (select 1 from public.products where products.id = product_colors.product_id and products.is_active = true)
  );
create policy "Public can read sizes for active products"
  on public.product_sizes for select using (
    exists (select 1 from public.products where products.id = product_sizes.product_id and products.is_active = true)
  );
create policy "Public can read details for active products"
  on public.product_details for select using (
    exists (select 1 from public.products where products.id = product_details.product_id and products.is_active = true)
  );
create policy "Public can read approved reviews"
  on public.product_reviews for select using (status = 'approved');

-- There is intentionally no public insert policy for reviews. The server route
-- will use the service-role key after validating and rate-limiting submissions.

insert into public.products (slug, name, price_egp, collection, stock_message, rating, review_count, display_order)
values
  ('tshirt-1', 'Tshirt', 850, 'XLIT original', 'Low stock · selling fast', 4.9, 128, 1),
  ('tshirt-2', 'Tshirt', 850, 'XLIT original', 'Low stock · selling fast', 4.8, 96, 2),
  ('tshirt-3', 'Tshirt', 850, 'XLIT original', 'Low stock · selling fast', 4.9, 84, 3),
  ('tshirt-4', 'Tshirt', 850, 'XLIT original', 'Low stock · selling fast', 4.7, 67, 4)
on conflict (slug) do nothing;

insert into public.product_images (product_id, image_path, display_order)
select p.id, image.image_path, image.display_order
from public.products p
join (
  values
    ('tshirt-1', '/products/1.png', 1), ('tshirt-1', '/products/1.png', 2), ('tshirt-1', '/products/1.png', 3), ('tshirt-1', '/products/1.png', 4),
    ('tshirt-2', '/products/2.png', 1), ('tshirt-2', '/products/2.png', 2), ('tshirt-2', '/products/2.png', 3), ('tshirt-2', '/products/2.png', 4),
    ('tshirt-3', '/products/3.png', 1), ('tshirt-3', '/products/3.png', 2), ('tshirt-3', '/products/3.png', 3), ('tshirt-3', '/products/3.png', 4),
    ('tshirt-4', '/products/4.png', 1), ('tshirt-4', '/products/4.1.png', 2)
) as image(slug, image_path, display_order) on image.slug = p.slug
on conflict (product_id, display_order) do nothing;

insert into public.product_colors (product_id, name, display_order)
select p.id, color.name, color.display_order
from public.products p
join (
  values
    ('tshirt-1', 'Black', 1), ('tshirt-1', 'Washed black', 2), ('tshirt-1', 'Charcoal', 3),
    ('tshirt-2', 'Black', 1), ('tshirt-2', 'Vintage black', 2),
    ('tshirt-3', 'Black', 1), ('tshirt-3', 'Charcoal', 2),
    ('tshirt-4', 'Off white', 1)
) as color(slug, name, display_order) on color.slug = p.slug
on conflict (product_id, display_order) do nothing;

insert into public.product_sizes (product_id, name, display_order)
select p.id, size.name, size.display_order
from public.products p
cross join (values ('S', 1), ('M', 2), ('L', 3), ('XL', 4)) as size(name, display_order)
on conflict (product_id, display_order) do nothing;

insert into public.product_details (product_id, detail_key, title, content, display_order)
select p.id, detail.detail_key::public.product_detail_key, detail.title, detail.content, detail.display_order
from public.products p
join (
  values
    ('tshirt-1', 'product_details', 'Product details', 'Heavyweight cotton construction with a relaxed, everyday fit.', 1),
    ('tshirt-1', 'size_chart', 'Size chart', 'True to size. Choose one size up for an oversized fit.', 2),
    ('tshirt-1', 'washing_instructions', 'Washing instructions', 'Wash cold inside out. Hang dry to preserve the print.', 3),
    ('tshirt-1', 'delivery', 'Delivery', 'Orders are prepared in 2–4 business days.', 4),
    ('tshirt-2', 'product_details', 'Product details', 'Soft, heavyweight cotton designed for daily wear.', 1),
    ('tshirt-2', 'size_chart', 'Size chart', 'True to size. Size up for an oversized fit.', 2),
    ('tshirt-2', 'washing_instructions', 'Washing instructions', 'Wash cold inside out and hang dry.', 3),
    ('tshirt-2', 'delivery', 'Delivery', 'Orders are prepared in 2–4 business days.', 4),
    ('tshirt-3', 'product_details', 'Product details', 'Heavyweight cotton with a relaxed silhouette.', 1),
    ('tshirt-3', 'size_chart', 'Size chart', 'True to size. Size up for an oversized fit.', 2),
    ('tshirt-3', 'washing_instructions', 'Washing instructions', 'Wash cold inside out and hang dry.', 3),
    ('tshirt-3', 'delivery', 'Delivery', 'Orders are prepared in 2–4 business days.', 4),
    ('tshirt-4', 'product_details', 'Product details', 'A lightweight cotton piece with a relaxed fit.', 1),
    ('tshirt-4', 'size_chart', 'Size chart', 'True to size. Size up for an oversized fit.', 2),
    ('tshirt-4', 'washing_instructions', 'Washing instructions', 'Wash cold inside out and hang dry.', 3),
    ('tshirt-4', 'delivery', 'Delivery', 'Orders are prepared in 2–4 business days.', 4)
) as detail(slug, detail_key, title, content, display_order) on detail.slug = p.slug
on conflict (product_id, detail_key) do nothing;

-- Existing reviews from products.ts remain visible after the migration.
insert into public.product_reviews (product_id, reviewer_name, content, stars, status, approved_at)
select p.id, review.reviewer_name, review.content, review.stars, 'approved', now()
from public.products p
join (
  values
    ('tshirt-1', 'Tariq', 'Highly satisfied. Will order again.', 5),
    ('tshirt-1', 'Fatima', 'Love this product. The quality is excellent.', 5),
    ('tshirt-1', 'Omar', 'Perfect fit and even better in person.', 5),
    ('tshirt-1', 'Salma', 'The details are incredible. Highly recommended.', 5),
    ('tshirt-2', 'Amina', 'The print looks even better in person.', 5),
    ('tshirt-2', 'Youssef', 'Great material and a perfect everyday fit.', 5),
    ('tshirt-3', 'Lina', 'Unique design and excellent quality.', 5),
    ('tshirt-3', 'Hassan', 'Comfortable fit. I will get another one.', 5),
    ('tshirt-4', 'Nour', 'The color and graphic are exactly as expected.', 5),
    ('tshirt-4', 'Adam', 'A standout piece with a very nice fit.', 5)
) as review(slug, reviewer_name, content, stars) on review.slug = p.slug
where not exists (
  select 1 from public.product_reviews existing
  where existing.product_id = p.id
    and existing.reviewer_name = review.reviewer_name
    and existing.content = review.content
);
