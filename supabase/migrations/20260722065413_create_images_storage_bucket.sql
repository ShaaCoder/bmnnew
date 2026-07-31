
/*
# Create Images Storage Bucket

## Overview
Sets up a public Supabase Storage bucket called `images` for storing
product and gallery images uploaded by the admin.

## Bucket Configuration
- Name: `images`
- Public: true (CDN URLs work without authentication)
- File size limit: 5 MB per file
- Allowed MIME types: JPEG, PNG, WebP, GIF

## Security (storage.objects RLS)
- Public read: anyone (anon + authenticated) can view/download images via public URL
- Upload / Update / Delete: authenticated users only (admin must be signed in)

## Important Notes
1. The bucket `public = true` flag makes the public URL endpoint accessible
   without auth for GET requests; RLS policies still control write operations.
2. ON CONFLICT clause makes the migration safe to re-run.
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
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read: anyone can access image URLs
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
CREATE POLICY "images_public_select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

-- Authenticated admin can upload
DROP POLICY IF EXISTS "images_auth_insert" ON storage.objects;
CREATE POLICY "images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Authenticated admin can update
DROP POLICY IF EXISTS "images_auth_update" ON storage.objects;
CREATE POLICY "images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Authenticated admin can delete
DROP POLICY IF EXISTS "images_auth_delete" ON storage.objects;
CREATE POLICY "images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
