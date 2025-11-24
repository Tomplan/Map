-- Migration 021: Add German (de) columns to event_activities
-- Adds title_de, description_de, location_de and badge_de to support German content

ALTER TABLE event_activities
  ADD COLUMN IF NOT EXISTS title_de TEXT,
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS location_de TEXT,
  ADD COLUMN IF NOT EXISTS badge_de TEXT;

-- Update constraint: venues should have nl, en and de when location_type = 'venue'
ALTER TABLE event_activities
  DROP CONSTRAINT IF EXISTS valid_location;

-- Backfill new German columns from existing English values where missing
UPDATE event_activities
SET
  title_de = COALESCE(title_de, title_en),
  description_de = COALESCE(description_de, description_en),
  location_de = COALESCE(location_de, location_en),
  badge_de = COALESCE(badge_de, badge_en)
WHERE TRUE;

-- Re-create the CHECK constraint after backfill so existing rows satisfy it
ALTER TABLE event_activities
  ADD CONSTRAINT valid_location CHECK (
    (location_type = 'exhibitor' AND company_id IS NOT NULL) OR
    (location_type = 'venue' AND location_nl IS NOT NULL AND location_en IS NOT NULL AND location_de IS NOT NULL)
  );

COMMENT ON COLUMN event_activities.title_de IS 'German title for activity (de)';
COMMENT ON COLUMN event_activities.description_de IS 'German description for activity (de)';
COMMENT ON COLUMN event_activities.location_de IS 'German venue/location text (de)';
COMMENT ON COLUMN event_activities.badge_de IS 'German badge text (de)';
