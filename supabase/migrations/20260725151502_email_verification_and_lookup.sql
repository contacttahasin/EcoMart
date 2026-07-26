-- A dedicated `email_verified` flag, separate from Supabase Auth's own
-- `email_confirmed_at`. We keep Supabase's mailer auto-confirm ON (see project
-- config) so signup stays instant, exactly like the current mock — this flag
-- is instead driven by an explicit "verify my email" action in Account
-- Settings (Phase 1), so the module is real without adding a signup gate.
alter table public.profiles
  add column email_verified boolean not null default false;

-- Lets signup forms show "this email is already registered" the same way the
-- current mock's client-side lookup does, without exposing auth.users
-- directly to the anon/authenticated roles.
create function public.is_email_registered(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.is_email_registered(text) to anon, authenticated;
