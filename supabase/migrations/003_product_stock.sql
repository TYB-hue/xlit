-- Track the exact number of units available for every XLIT product.
-- Existing products start at zero until the owner enters their real counts in /admin.
alter table public.products
  add column if not exists stock_quantity integer not null default 0
  check (stock_quantity >= 0);
