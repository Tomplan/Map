-- Add year column to staged_invoices for folder-based grouping.
-- Each invoice can be assigned to an event year (e.g. 2025, 2026).
-- NULL means unassigned / legacy record imported before this migration.

ALTER TABLE public.staged_invoices
  ADD COLUMN IF NOT EXISTS year INTEGER;

-- Index for folder-filtered queries
CREATE INDEX IF NOT EXISTS idx_staged_invoices_year ON public.staged_invoices (year);
