-- ==============================================================================
-- CS HUB — Supabase Storage Buckets & Policies Migration
-- Migration: 20261013000003_storage_buckets.sql
-- Description: Create private and public buckets with storage RLS policies
-- ==============================================================================

-- 1. Create Public Content Bucket (thumbnails, approved downloadable materials)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-content',
  'public-content',
  true,
  20971520, -- 20MB in bytes
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
    'application/pdf', 'text/plain', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- pptx
    'application/zip', 'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create Private Staging Bucket for Student Submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false, -- STRICTLY PRIVATE
  20971520, -- 20MB in bytes
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf', 'text/plain', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- pptx
    'application/zip', 'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- STORAGE OBJECTS RLS POLICIES
-- ------------------------------------------------------------------------------

-- PUBLIC CONTENT POLICIES
CREATE POLICY "Public files are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-content');

CREATE POLICY "Admins can upload public files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-content'
    AND public.is_admin()
  );

CREATE POLICY "Admins can update and delete public files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'public-content' AND public.is_admin());

CREATE POLICY "Admins can delete public files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'public-content' AND public.is_admin());

-- SUBMISSIONS (PRIVATE) POLICIES
-- Students can only upload into a directory path prefixed with their own user ID: "<user_id>/filename"
CREATE POLICY "Authenticated users can upload own submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submissions'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Submitter can read their own uploaded files; Admins can read all submission files
CREATE POLICY "Submitter or admin can view submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Only admins or owner can delete submission files
CREATE POLICY "Owner or admin can delete submission files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submissions'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );
