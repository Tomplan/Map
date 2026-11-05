-- Migration: Private Storage bucket "invoices" + admin-only access policies
--
-- Invoice PDFs contain customer names and addresses. They are stored in a PRIVATE bucket and
-- opened through short-lived signed URLs (see src/services/invoicePdfUploadService.js).
-- Access mirrors the staged_invoices table policies (migration 025).
--
-- After running this migration, copy the legacy PDFs from public/invoices into the bucket with:
--   node scripts/invoices/migrate-pdfs-to-storage.js            (dry run)
--   node scripts/invoices/migrate-pdfs-to-storage.js --confirm  (upload + link pdf_path)

INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Invoice PDFs: staff can read" ON storage.objects;
DROP POLICY IF EXISTS "Invoice PDFs: staff can upload" ON storage.objects;
DROP POLICY IF EXISTS "Invoice PDFs: staff can update" ON storage.objects;
DROP POLICY IF EXISTS "Invoice PDFs: staff can delete" ON storage.objects;

CREATE POLICY "Invoice PDFs: staff can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );

CREATE POLICY "Invoice PDFs: staff can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );

CREATE POLICY "Invoice PDFs: staff can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );

CREATE POLICY "Invoice PDFs: staff can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );
