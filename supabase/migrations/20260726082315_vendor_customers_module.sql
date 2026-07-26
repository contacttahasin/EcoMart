-- Customer Relations module: real product reviews (with vendor replies and
-- a proper per-user helpful-vote table so it can't be gamed by refreshing)
-- and a real vendor<->customer messaging system with Realtime delivery.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  helpful_count integer not null default 0,
  vendor_reply text,
  vendor_replied_at timestamptz,
  created_at timestamptz not null default now()
);

create index reviews_vendor_id_idx on public.reviews (vendor_id);
create index reviews_product_id_idx on public.reviews (product_id);

alter table public.reviews enable row level security;

create policy "reviews_select_public" on public.reviews
  for select using (true);

create policy "reviews_insert_own" on public.reviews
  for insert with check (customer_id = auth.uid());

create policy "reviews_update_vendor_reply" on public.reviews
  for update using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());

create table public.review_helpful_votes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

alter table public.review_helpful_votes enable row level security;

create policy "review_helpful_votes_select_public" on public.review_helpful_votes
  for select using (true);

create policy "review_helpful_votes_insert_own" on public.review_helpful_votes
  for insert with check (user_id = auth.uid());

create policy "review_helpful_votes_delete_own" on public.review_helpful_votes
  for delete using (user_id = auth.uid());

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  archived boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (vendor_id, customer_id)
);

alter table public.conversations enable row level security;

create policy "conversations_all_participant" on public.conversations
  for all using (vendor_id = auth.uid() or customer_id = auth.uid())
  with check (vendor_id = auth.uid() or customer_id = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and (c.vendor_id = auth.uid() or c.customer_id = auth.uid())
    )
  );

create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and (c.vendor_id = auth.uid() or c.customer_id = auth.uid())
    )
  );

create function public.touch_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_last_message();

alter publication supabase_realtime add table public.messages;
