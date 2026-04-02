-- Migration: Add pdf_path column to staged_invoices
-- Stores the Supabase Storage path for uploaded invoice PDFs.
-- The bucket is PRIVATE; access is via signed URLs generated on demand.
--
-- IMPORTANT: Create a PRIVATE Supabase Storage bucket named "invoices"
-- via the Supabase Dashboard (Storage → New Bucket → name: invoices, public: OFF)

ALTER TABLE public.staged_invoices
  ADD COLUMN IF NOT EXISTS pdf_path TEXT;
