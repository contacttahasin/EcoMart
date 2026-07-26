-- Customers following a vendor's storefront (public vendor profile page).
create table public.vendor_follows (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, vendor_id)
);

create index vendor_follows_vendor_id_idx on public.vendor_follows (vendor_id);
create index vendor_follows_customer_id_idx on public.vendor_follows (customer_id);

alter table public.vendor_follows enable row level security;

create policy "vendor_follows_select_own_or_admin" on public.vendor_follows
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "vendor_follows_insert_own" on public.vendor_follows
  for insert with check (customer_id = auth.uid());

create policy "vendor_follows_delete_own_or_admin" on public.vendor_follows
  for delete using (customer_id = auth.uid() or public.is_admin());

-- Extend the public vendor-by-slug RPC (20260726115836_public_top_vendors.sql)
-- with the social link columns (20260726010909_vendor_social_links.sql) and a
-- public follower count aggregate — same SECURITY DEFINER pattern as the
-- existing sales/product/rating aggregates, so raw vendor_follows rows (who
-- follows whom) stay private while the count is safe to expose.
drop function if exists public.get_vendor_by_slug(text);

create function public.get_vendor_by_slug(p_slug text)
returns table (
  vendor_id uuid,
  shop_name text,
  slug text,
  bio text,
  logo_url text,
  cover_image_url text,
  location text,
  joined_date date,
  verification_status vendor_verification_status,
  total_sales numeric,
  product_count bigint,
  avg_rating numeric,
  review_count bigint,
  website_url text,
  instagram_handle text,
  linkedin_url text,
  follower_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    vp.id,
    vp.shop_name,
    vp.slug,
    vp.bio,
    vp.logo_url,
    vp.cover_image_url,
    vp.location,
    vp.joined_date,
    vp.verification_status,
    coalesce(sales.total, 0) as total_sales,
    coalesce(prod.cnt, 0) as product_count,
    coalesce(rev.avg_rating, 0) as avg_rating,
    coalesce(rev.cnt, 0) as review_count,
    vp.website_url,
    vp.instagram_handle,
    vp.linkedin_url,
    coalesce(follows.cnt, 0) as follower_count
  from public.vendor_profiles vp
  left join (
    select oi.vendor_id, sum(oi.line_total) as total
    from public.order_items oi
    group by oi.vendor_id
  ) sales on sales.vendor_id = vp.id
  left join (
    select p.vendor_id, count(*) as cnt
    from public.products p
    where p.status = 'active'
    group by p.vendor_id
  ) prod on prod.vendor_id = vp.id
  left join (
    select r.vendor_id, avg(r.rating) as avg_rating, count(*) as cnt
    from public.reviews r
    group by r.vendor_id
  ) rev on rev.vendor_id = vp.id
  left join (
    select vf.vendor_id, count(*) as cnt
    from public.vendor_follows vf
    group by vf.vendor_id
  ) follows on follows.vendor_id = vp.id
  where vp.slug = p_slug;
$$;

grant execute on function public.get_vendor_by_slug(text) to anon, authenticated;
