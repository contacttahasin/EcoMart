-- The vendor inbox (services/vendor-customer.service.ts fetchConversations)
-- embeds the customer's `profiles` row to show their name/phone/avatar, but
-- profiles' existing RLS (`profiles_select_own_or_admin`) only lets a user
-- read their own row — so the embed silently comes back null for the vendor
-- and the UI falls back to a generic "Customer" label. Scope a minimal read
-- grant: a vendor can read a customer's profile only if they actually have
-- a conversation together, not profiles in general.
create policy "profiles_select_conversation_participant" on public.profiles
  for select using (
    exists (
      select 1 from public.conversations c
      where c.customer_id = profiles.id and c.vendor_id = auth.uid()
    )
  );
