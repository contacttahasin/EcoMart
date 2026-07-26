-- The Social Media Links fields in vendor Settings (Website/Instagram/LinkedIn)
-- had no backing columns at all — they were plain uncontrolled inputs.
alter table public.vendor_profiles
  add column website_url text,
  add column instagram_handle text,
  add column linkedin_url text;
