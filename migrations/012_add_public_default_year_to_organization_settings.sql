-- Add a global public default year to organization settings
-- This setting will be used to drive the public-facing default event year
-- without affecting an admin's working / preview year.

ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS public_default_year INTEGER;

COMMENT ON COLUMN organization_settings.public_default_year IS
  'Optional global default event year used for public/visitor views (integer, e.g. 2025)';

-- No policy changes here: only authorized roles should be able to update organization_settings
-- (RLS policies for organization_settings are applied elsewhere). Using IF NOT EXISTS
-- keeps this migration safe to run on databases that already contain the column.
