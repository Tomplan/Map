-- Verify migration 29: marker base size fields
-- Run these queries after applying migration/29_add_marker_base_sizes.sql

-- 1) Ensure columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Markers_Appearance'
  AND column_name IN ('iconbasesize', 'glyphbasesize', 'shadowscale');

-- 2) Count records where base sizes are default/fallback (-1 means not set in the new migration)
SELECT
  COUNT(*) FILTER (WHERE iconBaseSize IS NULL) as iconbasesize_null,
  COUNT(*) FILTER (WHERE glyphBaseSize IS NULL) as glyphbasesize_null,
  COUNT(*) FILTER (WHERE shadowScale IS NULL) as shadowscale_null,
  COUNT(*) as total_rows
FROM "Markers_Appearance";

-- 3) Sanity-check: any rows with invalid sizes (non-positive numbers?)
SELECT id, iconBaseSize, glyphBaseSize, shadowScale
FROM "Markers_Appearance"
WHERE (iconBaseSize IS NOT NULL AND (iconBaseSize[1] <= 0 OR iconBaseSize[2] <= 0))
   OR (glyphBaseSize IS NOT NULL AND glyphBaseSize <= 0)
   OR (shadowScale IS NOT NULL AND shadowScale <= 0);

-- 4) Basic counts for values that were backfilled (DEFAULTS used by migration)
SELECT iconBaseSize, COUNT(*) FROM "Markers_Appearance" GROUP BY iconBaseSize ORDER BY COUNT DESC LIMIT 10;
