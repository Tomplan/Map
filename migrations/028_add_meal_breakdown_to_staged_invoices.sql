-- Add separate meal breakdown columns to staged_invoices so that
-- we can persist the same per-day/per-type counts that EventSubscriptions
-- already supports.  Prior to this migration we only stored a single
-- "meals_count" value which made it impossible to import invoices and
-- retain the new breakfast/lunch/BBQ split.

ALTER TABLE public.staged_invoices
    ADD COLUMN breakfast_sat integer NOT NULL DEFAULT 0,
    ADD COLUMN lunch_sat integer NOT NULL DEFAULT 0,
    ADD COLUMN bbq_sat integer NOT NULL DEFAULT 0,
    ADD COLUMN breakfast_sun integer NOT NULL DEFAULT 0,
    ADD COLUMN lunch_sun integer NOT NULL DEFAULT 0;
