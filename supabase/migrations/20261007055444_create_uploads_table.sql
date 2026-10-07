/*
# Create uploads table and raw-files storage bucket

## Summary
Creates the core database table for the file-sharing application and a Supabase Storage bucket
to hold the raw uploaded files.

## New Tables
- `uploads`
  - `id` (uuid, primary key, auto-generated)
  - `slug` (text, unique, 8-character identifier used in share links /f/[slug])
  - `file_path` (text, path to the file in Supabase Storage bucket "raw-files")
  - `original_filename` (text, the original name of the uploaded file)
  - `file_size` (bigint, file size in bytes)
  - `mime_type` (text, MIME type of the uploaded file)
  - `created_at` (timestamptz, defaults to now())

## Storage
- Creates a new storage bucket `raw-files` (public, 2GB file size limit) for storing raw uploaded files.

## Security
- RLS enabled on `uploads` table.
- This is a no-auth single-tenant app — all CRUD is open to anon + authenticated since uploads and their share links are intentionally public.
- SELECT, INSERT, UPDATE, DELETE policies all use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`.
- Storage bucket is public so files can be served directly for download.

## Notes
1. The slug column has a unique constraint to prevent collisions on share links.
2. file_size is bigint to support large file sizes accurately.
3. No user_id column — this app has no authentication/sign-in flow.
*/

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  file_path text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_slug ON uploads(slug);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_uploads" ON uploads;
CREATE POLICY "anon_select_uploads" ON uploads FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_uploads" ON uploads;
CREATE POLICY "anon_insert_uploads" ON uploads FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_uploads" ON uploads;
CREATE POLICY "anon_update_uploads" ON uploads FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_uploads" ON uploads;
CREATE POLICY "anon_delete_uploads" ON uploads FOR DELETE
TO anon, authenticated USING (true);

-- Create the raw-files storage bucket (public, 2GB max file size)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('raw-files', 'raw-files', true, 2147483648)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to upload, read, and delete files in raw-files bucket
DROP POLICY IF EXISTS "anon_upload_raw_files" ON storage.objects;
CREATE POLICY "anon_upload_raw_files" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'raw-files');

DROP POLICY IF EXISTS "anon_read_raw_files" ON storage.objects;
CREATE POLICY "anon_read_raw_files" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'raw-files');

DROP POLICY IF EXISTS "anon_delete_raw_files" ON storage.objects;
CREATE POLICY "anon_delete_raw_files" ON storage.objects
FOR DELETE TO anon, authenticated USING (bucket_id = 'raw-files');
