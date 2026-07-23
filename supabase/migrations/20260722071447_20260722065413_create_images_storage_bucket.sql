/*
# Images Storage Bucket

## Overview
Creates a public Supabase Storage bucket called `images` used by the admin panel
to upload product images and gallery images directly from the local device.

## Bucket Configuration
- id / name: "images"
- public: true — CDN download URLs work without authentication (storefront can display images)
- file_size_limit: 5 242 880 bytes (5 MB per file)
- allowed_mime_types: image/jpeg, image/jpg, image/png, image/webp, image/gif

## Security (storage.objects RLS policies)
- SELECT  → anon + authenticated  (anyone can read/view images — required for the public store)
- INSERT  → authenticated only    (only signed-in admin can upload)
- UPDATE  → authenticated only    (only signed-in admin can overwrite)
- DELETE  → authenticated only    (only signed-in admin can remove)

## Important Notes
1. ON CONFLICT clause makes the bucket INSERT idempotent — safe to re-run.
2. Storage files are uploaded to paths: products/<timestamp>-<filename>
   and gallery/<timestamp>-<filename>.
3. Public URLs follow the pattern:
   <SUPABASE_URL>/storage/v1/object/public/images/<path>
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone (anon + authenticated) can read images — required for the public storefront
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
CREATE POLICY "images_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'images');

-- Only authenticated admin can upload new images
DROP POLICY IF EXISTS "images_auth_insert" ON storage.objects;
CREATE POLICY "images_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Only authenticated admin can update/overwrite images
DROP POLICY IF EXISTS "images_auth_update" ON storage.objects;
CREATE POLICY "images_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images');

-- Only authenticated admin can delete images
DROP POLICY IF EXISTS "images_auth_delete" ON storage.objects;
CREATE POLICY "images_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');
