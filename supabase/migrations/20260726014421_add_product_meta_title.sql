-- SEO meta title was captured in the Create Product form but had no column
-- to persist to (only short_description/meta_description existed via
-- `short_description`). Add it so the field is genuinely saved.
alter table public.products add column meta_title text;
