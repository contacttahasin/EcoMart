-- Product taxonomy: categories (self-referencing for a 2-level category/
-- subcategory hierarchy, replacing the free-text `subcategory` string the
-- mock data used) and brands.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories (id) on delete cascade,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index categories_parent_id_idx on public.categories (parent_id);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.brands enable row level security;

create policy "categories_select_public" on public.categories
  for select using (true);

create policy "categories_write_admin" on public.categories
  for all using (public.is_admin())
  with check (public.is_admin());

create policy "brands_select_public" on public.brands
  for select using (true);

create policy "brands_write_admin" on public.brands
  for all using (public.is_admin())
  with check (public.is_admin());

-- Seed the 4 top-level categories that already exist in the app today.
insert into public.categories (name, slug, sort_order) values
  ('Fresh Produce', 'fresh-produce', 1),
  ('Eco-Home', 'eco-home', 2),
  ('Personal Care', 'personal-care', 3),
  ('Electronics', 'electronics', 4);
