-- Payouts module: real payout methods a vendor can withdraw to, and real
-- withdrawal requests. Available/Pending/Lifetime balances are computed on
-- the fly from real order_items + payout_requests (see
-- vendor-payout.service.ts) rather than stored — no separate ledger table
-- needed since order_items and payout_requests are already the source of
-- truth for every credit/debit.
create type payout_method_type as enum ('bank', 'bkash', 'nagad');
create type payout_request_status as enum ('pending', 'processing', 'completed', 'rejected');

create table public.vendor_payout_methods (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  method_type payout_method_type not null,
  label text not null,
  account_detail text not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index vendor_payout_methods_vendor_id_idx on public.vendor_payout_methods (vendor_id);

alter table public.vendor_payout_methods enable row level security;

create policy "vendor_payout_methods_all_own_or_admin" on public.vendor_payout_methods
  for all using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());

create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  payout_method_id uuid references public.vendor_payout_methods (id) on delete set null,
  amount numeric(12, 2) not null,
  status payout_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create index payout_requests_vendor_id_idx on public.payout_requests (vendor_id);

alter table public.payout_requests enable row level security;

create policy "payout_requests_select_own_or_admin" on public.payout_requests
  for select using (vendor_id = auth.uid() or public.is_admin());

create policy "payout_requests_insert_own" on public.payout_requests
  for insert with check (vendor_id = auth.uid());

create policy "payout_requests_update_admin_only" on public.payout_requests
  for update using (public.is_admin())
  with check (public.is_admin());
