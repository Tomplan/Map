-- Add default marker appearance entries for assigned/unassigned markers
-- These defaults are used by useEventMarkers.js to apply base styling

-- Insert core entries first (required by foreign key constraint)
INSERT INTO markers_core (
  "id",
  "event_year",
  "lat",
  "lng",
  "coreLocked"
) VALUES
  (-1, 0, 0, 0, true),  -- Assigned markers default core
  (-2, 0, 0, 0, true);  -- Unassigned markers default core

-- Delete any existing appearance entries first
DELETE FROM markers_appearance WHERE "id" IN (-1, -2);

-- Insert the appearance default entries
INSERT INTO markers_appearance (
  "id",
  "event_year",
  "iconUrl",
  "appearanceLocked",
  "shadowScale"
) VALUES
  (-1, 0, 'glyph-marker-icon-blue.svg', true, 1),  -- Assigned markers default (blue)
  (-2, 0, 'glyph-marker-icon-gray.svg', true, 1);   -- Unassigned markers default (gray)