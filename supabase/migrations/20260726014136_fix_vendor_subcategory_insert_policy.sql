-- The previous policy's subquery `where p.id = parent_id` was ambiguous:
-- since the subquery's own FROM alias `p` also has a `parent_id` column,
-- Postgres resolved the bare `parent_id` to `p.parent_id` (the innermost
-- scope) instead of the row being inserted, collapsing the check to
-- `p.id = p.parent_id` which can never be true. Fully-qualify the inserted
-- row's column with the table name to disambiguate.
drop policy "categories_insert_vendor_subcategory" on public.categories;

create policy "categories_insert_vendor_subcategory" on public.categories
  for insert
  with check (
    categories.parent_id is not null
    and exists (select 1 from public.categories p where p.id = categories.parent_id and p.parent_id is null)
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );
