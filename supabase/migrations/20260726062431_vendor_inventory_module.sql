-- Real audit trail backing the Inventory page's "Stock Movement Log" and
-- "Restock Efficiency" stat — every stock quantity change (manual
-- adjustment, batch process, CSV import) gets a row here.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  change integer not null,
  reason text not null,
  updated_by text not null,
  created_at timestamptz not null default now()
);

create index stock_movements_vendor_id_created_at_idx on public.stock_movements (vendor_id, created_at desc);
create index stock_movements_product_id_idx on public.stock_movements (product_id);

alter table public.stock_movements enable row level security;

create policy "stock_movements_select_own_or_admin" on public.stock_movements
  for select using (vendor_id = auth.uid() or public.is_admin());

create policy "stock_movements_insert_own" on public.stock_movements
  for insert with check (vendor_id = auth.uid());

-- Applies one stock adjustment action to every product owned by the calling
-- vendor in a single transaction (used by the "Batch Stock Adjustment"
-- modal's Manual Batch option), logging one stock_movements row per product.
create function public.vendor_batch_adjust_stock(
  p_action text,
  p_quantity integer,
  p_updated_by text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid := auth.uid();
  v_count integer;
begin
  if p_quantity is null or p_quantity < 0 then
    raise exception 'Quantity must be zero or greater';
  end if;

  if p_action = 'add' then
    update public.products set stock = stock + p_quantity where vendor_id = v_vendor_id;
  elsif p_action = 'subtract' then
    update public.products set stock = greatest(0, stock - p_quantity) where vendor_id = v_vendor_id;
  elsif p_action = 'reset' then
    update public.products set stock = p_quantity where vendor_id = v_vendor_id;
  else
    raise exception 'Unknown adjustment action: %', p_action;
  end if;

  insert into public.stock_movements (product_id, vendor_id, change, reason, updated_by)
  select id, v_vendor_id,
    case p_action
      when 'add' then p_quantity
      when 'subtract' then -p_quantity
      else p_quantity
    end,
    'Batch Adjustment',
    p_updated_by
  from public.products
  where vendor_id = v_vendor_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.vendor_batch_adjust_stock(text, integer, text) to authenticated;
