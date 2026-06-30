-- =============================================================================
-- Storage buckets — site-public + site-private
-- v1.0 §17
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'site-public',
    'site-public',
    true,
    52428800,  -- 50MB
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif',
      'video/mp4', 'video/webm',
      'application/pdf'
    ]
  ),
  (
    'site-private',
    'site-private',
    false,
    52428800,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif',
      'video/mp4', 'video/webm',
      'application/pdf'
    ]
  )
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Storage RLS policies
-- -----------------------------------------------------------------------------

-- Limpar policies antigas
drop policy if exists "Public read site-public" on storage.objects;
drop policy if exists "Admin write site-public" on storage.objects;
drop policy if exists "Admin write site-private" on storage.objects;
drop policy if exists "Admin read site-private" on storage.objects;

-- site-public: leitura pública para todos
create policy "Public read site-public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-public');

-- site-public: somente admin escreve
create policy "Admin write site-public"
on storage.objects
for all
to authenticated
using (bucket_id = 'site-public' and public.is_admin())
with check (bucket_id = 'site-public' and public.is_admin());

-- site-private: leitura e escrita somente admin
create policy "Admin read site-private"
on storage.objects
for select
to authenticated
using (bucket_id = 'site-private' and public.is_admin());

create policy "Admin write site-private"
on storage.objects
for all
to authenticated
using (bucket_id = 'site-private' and public.is_admin())
with check (bucket_id = 'site-private' and public.is_admin());
