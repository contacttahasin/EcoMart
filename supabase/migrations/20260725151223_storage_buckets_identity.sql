-- Storage buckets needed for Phase 0 (account settings + vendor identity).
-- Path convention: the first folder segment of every object is the owning
-- profile/vendor id, e.g. avatars/{user_id}/photo.jpg — this is what the RLS
-- policies below check against auth.uid().

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('vendor-branding', 'vendor-branding', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('vendor-documents', 'vendor-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']);

-- avatars: public read, owner-only write (path: {user_id}/...)
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_write_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- vendor-branding (logo/cover): public read, owning vendor writes (path: {vendor_id}/...)
create policy "vendor_branding_select_public" on storage.objects
  for select using (bucket_id = 'vendor-branding');

create policy "vendor_branding_write_own" on storage.objects
  for insert with check (
    bucket_id = 'vendor-branding' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vendor_branding_update_own" on storage.objects
  for update using (
    bucket_id = 'vendor-branding' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vendor_branding_delete_own" on storage.objects
  for delete using (
    bucket_id = 'vendor-branding' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- vendor-documents (KYC): private — owning vendor + admin only (path: {vendor_id}/...)
create policy "vendor_documents_select_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'vendor-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "vendor_documents_write_own" on storage.objects
  for insert with check (
    bucket_id = 'vendor-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vendor_documents_update_own_or_admin" on storage.objects
  for update using (
    bucket_id = 'vendor-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "vendor_documents_delete_own_or_admin" on storage.objects
  for delete using (
    bucket_id = 'vendor-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
