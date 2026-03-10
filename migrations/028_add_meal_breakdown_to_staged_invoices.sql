-- Add separate meal count columns to staged_invoices
-- we already store a generic meals_count; this adds explicit
-- breakfast/lunch/bbq counts and keeps sunday fields for future use.

ALTER TABLE public.staged_invoices
  ADD COLUMN IF NOT EXISTS breakfast_sat INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lunch_sat INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bbq_sat INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS breakfast_sun INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lunch_sun INTEGER DEFAULT 0;

COMMENT ON COLUMN public.staged_invoices.breakfast_sat IS 'Number of Saturday breakfast meals parsed from invoice';
COMMENT ON COLUMN public.staged_invoices.lunch_sat IS 'Number of Saturday lunch meals parsed from invoice';
COMMENT ON COLUMN public.staged_invoices.bbq_sat IS 'Number of Saturday BBQ meals parsed from invoice';
COMMENT ON COLUMN public.staged_invoices.breakfast_sun IS 'Number of Sunday breakfast meals (currently unused)';
COMMENT ON COLUMN public.staged_invoices.lunch_sun IS 'Number of Sunday lunch meals (currently unused)';
