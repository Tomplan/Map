-- Fix marker_counts so it matches the UI definition of total assignable stands
-- Count only positive booth markers (exclude default markers -1/-2 and special markers >= 1000)

CREATE OR REPLACE VIEW marker_counts AS
SELECT
  event_year,
  COUNT(*) as count
FROM markers_core
WHERE id > 0
  AND id < 1000
GROUP BY event_year;

GRANT SELECT ON marker_counts TO authenticated;

COMMENT ON VIEW marker_counts IS 'Real-time count of assignable booth markers per event year (positive booth IDs only)';
