-- Add manager-only contact fields to organization_profile
-- These fields store the organization's default contact details (used in the Companies admin UI)

ALTER TABLE organization_profile
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN organization_profile.contact IS
  'Optional manager-only contact name for the organization (displayed in admin Companies tab)';

COMMENT ON COLUMN organization_profile.phone IS
  'Optional manager-only phone number for the organization (stored as text, normalized by application)';

COMMENT ON COLUMN organization_profile.email IS
  'Optional manager-only email address for the organization (stored lowercase)';
