-- Vendor Orders page: let a vendor see the parent order (order_number,
-- placed_at, shipping_address, payment info) and the customer's profile
-- (name/phone/avatar) for any order that contains one of their own line
-- items — additive, permissive SELECT policies (OR'd with the existing
-- customer/admin ones), so customer-owned access is unchanged.
create policy "orders_select_vendor" on public.orders
  for select using (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.vendor_id = auth.uid()
    )
  );

create policy "profiles_select_vendor_customer" on public.profiles
  for select using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.vendor_id = auth.uid() and o.customer_id = profiles.id
    )
  );

-- Real "Add Tracking" support on a line item.
alter table public.order_items add column tracking_number text;

-- Lets a vendor create a manual/phone order for an existing customer
-- account against one of their own products, without granting vendors
-- direct insert on `orders` (which would let them insert orders for
-- arbitrary customer_id values). SECURITY DEFINER so it can look up the
-- customer by email via auth.users, same pattern as is_email_registered().
create function public.vendor_create_manual_order(
  p_customer_email text,
  p_product_id uuid,
  p_quantity integer,
  p_shipping_name text,
  p_shipping_phone text,
  p_shipping_street text,
  p_shipping_city text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid := auth.uid();
  v_customer_id uuid;
  v_product record;
  v_order_id uuid;
  v_line_total numeric(12, 2);
begin
  if not exists (select 1 from public.vendor_profiles where id = v_vendor_id) then
    raise exception 'Only vendors can create manual orders';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  select id into v_customer_id from auth.users where lower(email) = lower(p_customer_email);
  if v_customer_id is null then
    raise exception 'No customer account found for that email';
  end if;

  select
    p.id,
    p.title,
    coalesce(p.sale_price, p.price) as unit_price,
    (
      select pi.url from public.product_images pi
      where pi.product_id = p.id
      order by pi.is_primary desc, pi.sort_order asc
      limit 1
    ) as image_url
  into v_product
  from public.products p
  where p.id = p_product_id and p.vendor_id = v_vendor_id;

  if v_product.id is null then
    raise exception 'Product not found for this vendor';
  end if;

  v_line_total := v_product.unit_price * p_quantity;

  insert into public.orders (order_number, customer_id, status, subtotal, total_amount, shipping_address, payment_method, payment_status)
  values (
    'MO-' || to_char(now(), 'YYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4),
    v_customer_id,
    'processing',
    v_line_total,
    v_line_total,
    jsonb_build_object('full_name', p_shipping_name, 'phone', p_shipping_phone, 'street', p_shipping_street, 'city', p_shipping_city),
    'card',
    'pending'
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, vendor_id, product_title_snapshot, product_image_snapshot, unit_price, quantity, line_total, item_status)
  values (
    v_order_id, v_product.id, v_vendor_id, v_product.title, v_product.image_url, v_product.unit_price, p_quantity, v_line_total, 'processing'
  );

  return v_order_id;
end;
$$;

grant execute on function public.vendor_create_manual_order(text, uuid, integer, text, text, text, text) to authenticated;
