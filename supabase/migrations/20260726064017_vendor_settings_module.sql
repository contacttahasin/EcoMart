-- Real backing for the vendor Settings page's Policy Configuration and
-- Shipping Rates cards, which previously had no columns to persist to.
alter table public.vendor_profiles add column return_policy text;
alter table public.vendor_profiles add column refund_policy text;
alter table public.vendor_profiles add column shipping_rates jsonb not null default '[]'::jsonb;
alter table public.vendor_profiles add column free_shipping_enabled boolean not null default false;
alter table public.vendor_profiles add column free_shipping_threshold numeric(12, 2);
