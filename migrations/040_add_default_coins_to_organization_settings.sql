-- Move default_coins from organization_profile to organization_settings
-- so all subscription defaults live in the same table.

ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS default_coins INTEGER DEFAULT 0;

-- Copy existing value from organization_profile if it was set
UPDATE organization_settings
SET default_coins = COALESCE(
  (SELECT default_coins FROM organization_profile WHERE id = 1),
  0
)
WHERE id = 1 AND default_coins = 0;

COMMENT ON COLUMN organization_settings.default_coins IS
  'Default number of coins per booth subscription (multiplied by booth_count)';
