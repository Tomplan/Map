-- Add kvk (Chamber of Commerce) number column to companies

ALTER TABLE companies
  ADD COLUMN kvk_number text;

-- This column is nullable. It complements vat_number for Dutch businesses.
