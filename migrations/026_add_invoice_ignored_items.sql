-- Add a JSONB column to organization_settings to store an array of strings
-- representing items that should be ignored during PDF invoice parsing.

ALTER TABLE organization_settings 
ADD COLUMN IF NOT EXISTS invoice_ignored_items JSONB DEFAULT '[]'::jsonb;

-- Comment for the schema
COMMENT ON COLUMN organization_settings.invoice_ignored_items IS 'List of keywords or exact item names to ignore when parsing invoice line items.';
