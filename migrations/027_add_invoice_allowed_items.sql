-- Switch from an ignore-list approach to an include-list approach for invoice parsing.
-- Create the new column.
ALTER TABLE organization_settings 
ADD COLUMN IF NOT EXISTS invoice_allowed_items JSONB DEFAULT '[]'::jsonb;

-- Comment for the schema
COMMENT ON COLUMN organization_settings.invoice_allowed_items IS 'List of exact item names that should be included when parsing invoice line items. All others are ignored.';

-- Optionally, we could drop the ignored items if it's completely dead but keeping it around doesn't hurt.
-- ALTER TABLE organization_settings DROP COLUMN IF EXISTS invoice_ignored_items;
