-- Migration 008: Add show_location_type_badge column
-- Purpose: Allow activities to optionally hide the location type badge (exhibitor/venue)
-- Default: false (badge hidden) since "location" badge is usually not needed

-- Add the new column with default false (badge hidden by default)
ALTER TABLE event_activities 
ADD COLUMN show_location_type_badge BOOLEAN DEFAULT false;

-- Update comment for documentation
COMMENT ON COLUMN event_activities.show_location_type_badge IS 'Whether to show exhibitor/venue badge in public display (default false)';

-- Optional: Set to true for specific activities where the badge is useful
-- Example: UPDATE event_activities SET show_location_type_badge = true WHERE location_type = 'exhibitor';
