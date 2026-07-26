-- Real product catalog, backing the vendor "Create New Product" form.
-- categories/brands already exist (core_identity + categories_and_brands
-- migrations); this adds the products table and its child tables, plus wires
-- up the FK that order_items.product_id was deliberately left without until
-- this table existed.

create type product_status as enum ('draft', 'pending_review', 'active', 'inactive', 'rejected');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  category_id uuid references public.categories (id),
  subcategory_id uuid references public.categories (id),
  brand_id uuid references public.brands (id),
  title text not null,
  slug text not null unique,
  description text,
  short_description text,
  price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2),
  sku text,
  unit text,
  stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  status product_status not null default 'draft',
  video_url text,
  return_policy text,
  warranty text,
  shipping_info text,
  tags text[] not null default '{}',
  highlights text[] not null default '{}',
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_vendor_id_idx on public.products (vendor_id);
create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_slug_idx on public.products (slug);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false
);

create index product_images_product_id_idx on public.product_images (product_id);

create table public.product_variant_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create index product_variant_groups_product_id_idx on public.product_variant_groups (product_id);

create table public.product_variant_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.product_variant_groups (id) on delete cascade,
  value text not null,
  price_delta numeric(12, 2) not null default 0,
  stock integer,
  sku text,
  sort_order integer not null default 0
);

create index product_variant_options_group_id_idx on public.product_variant_options (group_id);

-- Now that products exists, order_items can finally point to it for real.
alter table public.order_items
  add constraint order_items_product_id_fkey foreign key (product_id) references public.products (id) on delete set null;

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variant_groups enable row level security;
alter table public.product_variant_options enable row level security;

create policy "products_select_public_or_owner_or_admin" on public.products
  for select using (status = 'active' or vendor_id = auth.uid() or public.is_admin());

create policy "products_insert_own" on public.products
  for insert with check (vendor_id = auth.uid());

create policy "products_update_own_or_admin" on public.products
  for update using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());

create policy "products_delete_own_or_admin" on public.products
  for delete using (vendor_id = auth.uid() or public.is_admin());

create policy "product_images_select" on public.product_images
  for select using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and (products.status = 'active' or products.vendor_id = auth.uid() or public.is_admin())
    )
  );

create policy "product_images_write_own" on public.product_images
  for all using (
    exists (select 1 from public.products where products.id = product_images.product_id and products.vendor_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.products where products.id = product_images.product_id and products.vendor_id = auth.uid())
    or public.is_admin()
  );

create policy "product_variant_groups_select" on public.product_variant_groups
  for select using (
    exists (
      select 1 from public.products
      where products.id = product_variant_groups.product_id
        and (products.status = 'active' or products.vendor_id = auth.uid() or public.is_admin())
    )
  );

create policy "product_variant_groups_write_own" on public.product_variant_groups
  for all using (
    exists (select 1 from public.products where products.id = product_variant_groups.product_id and products.vendor_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.products where products.id = product_variant_groups.product_id and products.vendor_id = auth.uid())
    or public.is_admin()
  );

create policy "product_variant_options_select" on public.product_variant_options
  for select using (
    exists (
      select 1 from public.product_variant_groups
      join public.products on products.id = product_variant_groups.product_id
      where product_variant_groups.id = product_variant_options.group_id
        and (products.status = 'active' or products.vendor_id = auth.uid() or public.is_admin())
    )
  );

create policy "product_variant_options_write_own" on public.product_variant_options
  for all using (
    exists (
      select 1 from public.product_variant_groups
      join public.products on products.id = product_variant_groups.product_id
      where product_variant_groups.id = product_variant_options.group_id and products.vendor_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.product_variant_groups
      join public.products on products.id = product_variant_groups.product_id
      where product_variant_groups.id = product_variant_options.group_id and products.vendor_id = auth.uid()
    )
    or public.is_admin()
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "product_images_bucket_select_public" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_bucket_write_own" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_bucket_update_own" on storage.objects
  for update using (
    bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_bucket_delete_own" on storage.objects
  for delete using (
    bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
