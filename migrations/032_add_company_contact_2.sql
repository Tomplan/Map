-- Add secondary contact fields to companies table
-- These are populated when an invoice has a second contact/email/phone
-- that differs from what is already stored in the primary fields.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS contact_name_2  TEXT,
  ADD COLUMN IF NOT EXISTS contact_email_2 TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone_2 TEXT;
