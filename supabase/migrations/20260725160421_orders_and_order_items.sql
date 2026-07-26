-- Core Order Management schema. `order_items.product_id` intentionally has
-- no FK yet — the normalized `products` table doesn't exist until the
-- Product Catalog module lands; a follow-up migration adds that constraint
-- once it does. Line items snapshot title/image/price at purchase time
-- (standard e-commerce practice), so they remain valid either way.

create type order_status as enum (
  'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested', 'returned'
);
create type order_item_status as enum ('processing', 'shipped', 'delivered', 'cancelled', 'returned');
create type delivery_method as enum ('standard', 'eco');
create type payment_method as enum ('card', 'bkash', 'nagad');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  status order_status not null default 'pending',
  subtotal numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  shipping_fee numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  shipping_address jsonb,
  billing_address jsonb,
  delivery_method delivery_method not null default 'standard',
  payment_method payment_method not null default 'card',
  payment_status payment_status not null default 'pending',
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_placed_at_idx on public.orders (placed_at);

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid,
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  product_title_snapshot text not null,
  product_image_snapshot text,
  variant_selection jsonb,
  unit_price numeric(12, 2) not null,
  quantity integer not null default 1,
  line_total numeric(12, 2) not null,
  item_status order_item_status not null default 'processing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_vendor_id_idx on public.order_items (vendor_id);
create index order_items_created_at_idx on public.order_items (created_at);

create trigger set_order_items_updated_at
  before update on public.order_items
  for each row execute function public.set_updated_at();

-- Order status history, powering real order timelines instead of hardcoded steps.
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- orders: owning customer + admin only. Vendors read their slice through
-- order_items (an order can span multiple vendors), not this table directly.
create policy "orders_select_own_or_admin" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "orders_insert_own" on public.orders
  for insert with check (customer_id = auth.uid());

create policy "orders_update_own_or_admin" on public.orders
  for update using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- order_items: the owning vendor (their line items), the owning customer
-- (via the parent order), or admin.
create policy "order_items_select_vendor_or_customer_or_admin" on public.order_items
  for select using (
    vendor_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.customer_id = auth.uid()
    )
  );

create policy "order_items_insert_own_order" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.customer_id = auth.uid()
    )
  );

create policy "order_items_update_vendor_or_admin" on public.order_items
  for update using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());

create policy "order_status_history_select" on public.order_status_history
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders
      where orders.id = order_status_history.order_id and orders.customer_id = auth.uid()
    )
    or exists (
      select 1 from public.order_items
      where order_items.id = order_status_history.order_item_id and order_items.vendor_id = auth.uid()
    )
  );

create policy "order_status_history_insert_vendor_or_admin" on public.order_status_history
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.order_items
      where order_items.id = order_status_history.order_item_id and order_items.vendor_id = auth.uid()
    )
  );
