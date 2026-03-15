-- Migration: custom invoice folders
-- Creates a managed invoice_folders table so admins can create, rename,
-- reorder and delete folders with any name (not just year numbers).
-- staged_invoices.folder_id links an invoice to a folder (NULL = Unassigned).

-- 1. Folder table
CREATE TABLE IF NOT EXISTS public.invoice_folders (
  id       UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name     TEXT    NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoice_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event managers can manage invoice folders"
  ON public.invoice_folders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );

-- 2. Link staged_invoices to a folder (drop old year column if it exists)
ALTER TABLE public.staged_invoices
  DROP COLUMN IF EXISTS year;

ALTER TABLE public.staged_invoices
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.invoice_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staged_invoices_folder_id ON public.staged_invoices (folder_id);
