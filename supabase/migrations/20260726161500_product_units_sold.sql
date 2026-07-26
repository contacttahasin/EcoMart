-- Real "best-selling" signal for public product sorting/ribbons. Sales data
-- lives in order_items, which isn't publicly readable, so instead of a
-- security-definer aggregate on every storefront read, this denormalizes a
-- running total onto products (itself publicly readable) via a trigger —
-- same shape as vendor_profiles.monthly_sales already does for vendors.
alter table public.products add column units_sold integer not null default 0;

create function public.increment_product_units_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products
    set units_sold = units_sold + new.quantity
    where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger on_order_item_created_increment_units_sold
after insert on public.order_items
for each row execute function public.increment_product_units_sold();
