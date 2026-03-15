-- Migration: Rename staged_invoices.notes → staged_invoices.parsed_data
--
-- The `notes` column on staged_invoices stores a JSON blob with parsed invoice
-- metadata (line items, contact details, area, dates, etc.) — not human-readable
-- customer notes.  Renaming to `parsed_data` eliminates confusion with the
-- `event_subscriptions.notes` column which holds actual customer remarks.

ALTER TABLE public.staged_invoices
  RENAME COLUMN notes TO parsed_data;

-- Add a comment for documentation
COMMENT ON COLUMN public.staged_invoices.parsed_data IS
  'JSON blob containing parsed invoice metadata: line_items, client_block, contact fields, area, date, rawNotes, notes (customer remark).';
