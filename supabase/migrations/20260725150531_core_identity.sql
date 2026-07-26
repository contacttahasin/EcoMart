-- Core identity: profiles (customer + vendor + admin unified under Supabase Auth),
-- vendor business profiles, addresses, and lightweight session/login tracking.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('customer', 'vendor', 'admin');
create type account_status as enum ('active', 'suspended', 'banned');
create type address_label as enum ('home', 'office', 'other');
create type vendor_business_type as enum ('individual', 'proprietorship', 'private-limited');
create type vendor_verification_status as enum ('pending', 'approved', 'rejected');
create type vendor_doc_type as enum (
  'trade_license',
  'id_front',
  'id_back',
  'business_registration',
  'payout_verification',
  'selfie'
);
create type document_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, holds fields shared by every role
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  phone text,
  phone_verified boolean not null default false,
  avatar_url text,
  account_status account_status not null default 'active',
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new Supabase Auth user is created.
-- Role/full_name/phone are read from signUp() metadata (data: { role, full_name, phone }).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')::user_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- vendor_profiles: 1:1 with profiles for role = 'vendor'
-- ---------------------------------------------------------------------------

create table public.vendor_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null,
  shop_name text not null,
  slug text not null unique,
  store_name text,
  bio text,
  cover_image_url text,
  logo_url text,
  business_type vendor_business_type,
  business_category text,
  address text,
  postal_code text,
  location text,
  trade_license_number text,
  tin text,
  verification_status vendor_verification_status not null default 'pending',
  verified boolean not null default false,
  featured boolean not null default false,
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  total_reviews integer not null default 0,
  monthly_sales numeric(12, 2) not null default 0,
  joined_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendor_profiles_slug_idx on public.vendor_profiles (slug);
create index vendor_profiles_verification_status_idx on public.vendor_profiles (verification_status);

create trigger set_vendor_profiles_updated_at
  before update on public.vendor_profiles
  for each row execute function public.set_updated_at();

create table public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  doc_type vendor_doc_type not null,
  file_path text not null,
  status document_status not null default 'pending',
  uploaded_at timestamptz not null default now()
);

create index vendor_documents_vendor_id_idx on public.vendor_documents (vendor_id);

-- ---------------------------------------------------------------------------
-- addresses: shipping/billing book, owned by any profile (customer or vendor)
-- ---------------------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label address_label not null default 'home',
  full_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null default 'Bangladesh',
  is_default boolean not null default false,
  is_billing boolean not null default true,
  is_shipping boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- Only one default address per user.
create unique index addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

create trigger set_addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Session / login tracking (Active Sessions + Login Activity UI)
-- ---------------------------------------------------------------------------

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device text,
  browser text,
  ip_address text,
  location text,
  user_agent text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index user_sessions_user_id_idx on public.user_sessions (user_id);

create table public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  ip_address text,
  user_agent text,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index login_activity_user_id_idx on public.login_activity (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vendor_profiles enable row level security;
alter table public.vendor_documents enable row level security;
alter table public.addresses enable row level security;
alter table public.user_sessions enable row level security;
alter table public.login_activity enable row level security;

-- Helper: is the current JWT an admin? (SECURITY DEFINER avoids RLS recursion on profiles)
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: owner can read/update own row; admins can read/update all.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- vendor_profiles: publicly readable (storefronts), owner/admin can write.
create policy "vendor_profiles_select_public" on public.vendor_profiles
  for select using (true);

create policy "vendor_profiles_insert_own" on public.vendor_profiles
  for insert with check (auth.uid() = id);

create policy "vendor_profiles_update_own_or_admin" on public.vendor_profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- vendor_documents: private — owner vendor + admin only.
create policy "vendor_documents_all_own_or_admin" on public.vendor_documents
  for all using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());

-- addresses: strictly owner + admin.
create policy "addresses_all_own_or_admin" on public.addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- user_sessions / login_activity: owner can read own, admin can read all.
-- Inserts/updates happen via the service role from server-side auth hooks only.
create policy "user_sessions_select_own_or_admin" on public.user_sessions
  for select using (user_id = auth.uid() or public.is_admin());

create policy "user_sessions_update_own" on public.user_sessions
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "login_activity_select_own_or_admin" on public.login_activity
  for select using (user_id = auth.uid() or public.is_admin());
