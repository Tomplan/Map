-- Add Branding Columns to Organization_Profile
-- These columns store visual branding settings (colors, fonts)

-- Add branding columns
ALTER TABLE "Organization_Profile"
ADD COLUMN IF NOT EXISTS "theme_color" TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS "font_family" TEXT DEFAULT 'Arvo, Sans-serif';

-- Update existing row with defaults
UPDATE "Organization_Profile"
SET 
  "theme_color" = COALESCE("theme_color", '#ffffff'),
  "font_family" = COALESCE("font_family", 'Arvo, Sans-serif')
WHERE id = 1;
