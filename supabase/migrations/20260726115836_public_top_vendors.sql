-- Real "Top Rated Vendors" ranking for the public landing page. Sales come
-- from order_items, which isn't publicly readable (only the owning vendor,
-- the owning customer, or an admin can read it) — so this exposes only the
-- aggregate a visitor is allowed to see, never raw order rows, via a
-- SECURITY DEFINER function (same pattern as is_admin()/vendor_owns_order()).
create function public.get_top_vendors(p_limit integer default 6)
returns table (
  vendor_id uuid,
  shop_name text,
  slug text,
  bio text,
  logo_url text,
  cover_image_url text,
  verification_status vendor_verification_status,
  total_sales numeric,
  product_count bigint,
  avg_rating numeric,
  review_count bigint
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
    vp.verification_status,
    coalesce(sales.total, 0) as total_sales,
    coalesce(prod.cnt, 0) as product_count,
    coalesce(rev.avg_rating, 0) as avg_rating,
    coalesce(rev.cnt, 0) as review_count
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
  where coalesce(prod.cnt, 0) > 0
  order by coalesce(sales.total, 0) desc, coalesce(prod.cnt, 0) desc
  limit p_limit;
$$;

grant execute on function public.get_top_vendors(integer) to anon, authenticated;

-- Also lets the /vendors/[slug] public profile page look up one real vendor
-- (with the same real aggregates) by slug.
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
  review_count bigint
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
    coalesce(rev.cnt, 0) as review_count
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
  where vp.slug = p_slug;
$$;

grant execute on function public.get_vendor_by_slug(text) to anon, authenticated;
