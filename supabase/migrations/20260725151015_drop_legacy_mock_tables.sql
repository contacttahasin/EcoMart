-- Remove the preliminary flat/denormalized tables that mirrored the mock TS
-- types 1:1 (text PKs, jsonb blobs for nested arrays, no FKs to auth.users,
-- no RLS). They held negligible data (1 test product, 1 test vendor, 0
-- customers/orders) and are being replaced by the normalized schema in
-- subsequent migrations (profiles/vendor_profiles already in place).

drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.customers cascade;
drop table if exists public.vendors cascade;
