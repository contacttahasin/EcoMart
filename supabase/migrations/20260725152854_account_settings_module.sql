-- Account Settings module: real email/phone verification status (synced from
-- Supabase Auth's own confirmation timestamps rather than a manually-managed
-- flag), notification preferences, and the RLS inserts needed for login
-- activity / active session tracking. Two-Factor Auth uses Supabase Auth's
-- native MFA (auth.mfa_factors) — no extra schema needed for that.

alter table public.profiles
  add column notification_preferences jsonb not null default
    '{"orderUpdates": true, "ecoTips": false, "securityAlerts": true}'::jsonb;

-- Reflect Supabase Auth's own confirmation state into profiles at signup time
-- (mailer/sms auto-confirm means this is usually already true on day one).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email_verified, phone_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')::user_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email_confirmed_at is not null,
    new.phone_confirmed_at is not null
  );
  return new;
end;
$$;

-- Keep it in sync afterwards too — e.g. once a changed email's confirmation
-- link is clicked, auth.users.email_confirmed_at flips and this mirrors it.
create function public.handle_user_verification_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email_verified = new.email_confirmed_at is not null,
    phone_verified = new.phone_confirmed_at is not null
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_verification_change
  after update of email_confirmed_at, phone_confirmed_at on auth.users
  for each row execute function public.handle_user_verification_change();

-- Client-side inserts for login activity / active session tracking, both
-- scoped to the authenticated user making the request.
create policy "login_activity_insert_own" on public.login_activity
  for insert with check (user_id = auth.uid());

create policy "user_sessions_insert_own" on public.user_sessions
  for insert with check (user_id = auth.uid());
