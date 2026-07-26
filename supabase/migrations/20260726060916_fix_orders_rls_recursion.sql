-- `orders_select_vendor` (previous migration) referenced `order_items`
-- directly, and `order_items`'s existing policy references `orders` back —
-- a circular RLS dependency Postgres detects as "infinite recursion
-- detected in policy for relation order_items" and refuses to evaluate,
-- which broke every `profiles` read for a logged-in vendor (session
-- hydration itself does a profiles select). Fix: route the vendor-ownership
-- check through a SECURITY DEFINER function, same pattern as is_admin() —
-- it bypasses RLS internally so evaluating it never re-triggers order_items'
-- or orders' own policies, breaking the cycle.
create function public.vendor_owns_order(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.order_items
    where order_id = p_order_id and vendor_id = auth.uid()
  );
$$;

create function public.vendor_has_customer(p_customer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.vendor_id = auth.uid() and o.customer_id = p_customer_id
  );
$$;

drop policy "orders_select_vendor" on public.orders;
create policy "orders_select_vendor" on public.orders
  for select using (public.vendor_owns_order(orders.id));

drop policy "profiles_select_vendor_customer" on public.profiles;
create policy "profiles_select_vendor_customer" on public.profiles
  for select using (public.vendor_has_customer(profiles.id));
