-- Add extra contact/address/vat fields to companies table

ALTER TABLE companies
  ADD COLUMN contact_name text,
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text,
  ADD COLUMN address_line1 text,
  ADD COLUMN address_line2 text,
  ADD COLUMN city text,
  ADD COLUMN postal_code text,
  ADD COLUMN country text,
  ADD COLUMN vat_number text;

-- Note: columns are nullable by default. Existing rows will simply have NULL values.
-- You may want to backfill from existing data or provide a migration script later.
