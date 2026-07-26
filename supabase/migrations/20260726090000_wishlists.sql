-- Customer wishlists. `product_id` is `text`, not a FK, because the
-- storefront catalog (data/products.ts) is still mock data with non-UUID
-- ids — matches the same constraint `order_items.product_id` already
-- documents in 20260725160421_orders_and_order_items.sql.
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlists_user_id_idx on public.wishlists (user_id);

alter table public.wishlists enable row level security;

create policy "wishlists_all_own" on public.wishlists
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
