ALTER TABLE organization_profile ADD COLUMN IF NOT EXISTS qr_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN organization_profile.qr_config IS 'Default QR code configuration for the organization';
