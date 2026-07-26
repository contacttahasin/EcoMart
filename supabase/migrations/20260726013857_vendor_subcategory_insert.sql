-- Allow vendors to create subcategories (children of an existing top-level
-- category) while writing a product, without granting them the ability to
-- create or edit top-level categories/brands (still admin-only).
create policy "categories_insert_vendor_subcategory" on public.categories
  for insert
  with check (
    parent_id is not null
    and exists (select 1 from public.categories p where p.id = parent_id and p.parent_id is null)
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );
