-- Verification for migration 30_backfill_icon_and_glyph_sizes.sql
-- Run after applying migration to check how many rows remain that still
-- have legacy base fields but no values copied to iconSize/glyphSize.

-- Count rows where iconSize is still NULL but iconBaseSize exists
SELECT COUNT(*) as remaining_iconBase_to_copy
FROM "Markers_Appearance"
WHERE ("iconSize" IS NULL OR array_length("iconSize",1) IS NULL)
  AND "iconBaseSize" IS NOT NULL;

-- Count rows where glyphSize is still NULL/empty but glyphBaseSize exists
SELECT COUNT(*) as remaining_glyphBase_to_copy
FROM "Markers_Appearance"
WHERE ("glyphSize" IS NULL OR trim("glyphSize") = '')
  AND "glyphBaseSize" IS NOT NULL;

-- Helpful sample rows to inspect when debugging
SELECT id, iconSize, iconBaseSize, glyphSize, glyphBaseSize
FROM "Markers_Appearance"
WHERE ("iconSize" IS NULL OR array_length("iconSize",1) IS NULL)
   OR ("glyphSize" IS NULL OR trim("glyphSize") = '')
LIMIT 50;
