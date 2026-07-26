-- Promotions module: real ad campaigns a vendor runs to boost a product.
-- Impressions/clicks/ROAS have no honest data source yet (no ad-serving or
-- storefront placement tracking exists), so the Marketing Center's analytics
-- cards are computed from real budget/spend data instead, not fabricated.
create type campaign_type as enum ('featured', 'sponsored', 'flash_deal', 'top_rank');
create type campaign_pricing_model as enum ('fixed', 'ppc');
create type campaign_payment_method as enum ('wallet', 'bkash', 'nagad');
create type campaign_status as enum ('active', 'paused', 'completed');

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  campaign_type campaign_type not null,
  pricing_model campaign_pricing_model not null,
  payment_method campaign_payment_method not null,
  budget_amount numeric(12, 2) not null,
  duration_days integer,
  spent numeric(12, 2) not null default 0,
  status campaign_status not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_vendor_id_idx on public.campaigns (vendor_id);
create index campaigns_product_id_idx on public.campaigns (product_id);

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

create policy "campaigns_all_own_or_admin" on public.campaigns
  for all using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());
