-- Certifications storage bucket (Sep 29, 2026)
--
-- Sets up a public-read Supabase Storage bucket for Green Labs certification
-- PDFs (individual Ambassador certs + lab / clinic certification documents).
--
-- Path conventions enforced by the app (src/lib/storage.ts), not RLS:
--   ambassadors/{profile_id}/{timestamp}-{safe_name}.pdf   -- individual cert
--   labs/{faculty_id}/{timestamp}-{safe_name}.pdf          -- lab / clinic cert
--
-- RLS shape:
--   * Public read — anyone can view / download a cert. The About page's
--     "list of certified ambassadors and labs" will use this to link to PDFs.
--   * Authenticated insert — must be signed in to upload. The app decides
--     the path; RLS does not restrict it further because ownership is
--     captured via storage.objects.owner (auth.uid()).
--   * Owner or admin delete/update — protects against random users
--     overwriting or deleting each other's certificates.

-- ============================================
-- BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certifications',
  'certifications',
  TRUE,
  10485760,  -- 10 MB per file — plenty for a PDF certificate
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================
-- RLS POLICIES on storage.objects, scoped to this bucket
-- ============================================
-- Drop any prior versions so this migration is safely re-runnable.
DROP POLICY IF EXISTS "certifications_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "certifications_auth_insert"    ON storage.objects;
DROP POLICY IF EXISTS "certifications_owner_update"   ON storage.objects;
DROP POLICY IF EXISTS "certifications_owner_delete"   ON storage.objects;

-- Public read (anyone can download; the bucket also has public=true so
-- getPublicUrl works without a signed URL).
CREATE POLICY "certifications_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certifications');

-- Any signed-in user can upload. The path convention (ambassadors/{uid}/…
-- or labs/{fid}/…) is enforced by application code, not RLS — restricting
-- path structure at the RLS layer would block legitimate admin uploads on
-- behalf of a user or lab.
CREATE POLICY "certifications_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certifications'
    AND auth.role() = 'authenticated'
  );

-- Uploader or admin can update the file (e.g. replace with a corrected PDF).
CREATE POLICY "certifications_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certifications'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Uploader or admin can delete. Prevents random users from deleting each
-- other's certificates.
CREATE POLICY "certifications_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certifications'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
