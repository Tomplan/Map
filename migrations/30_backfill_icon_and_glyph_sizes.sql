-- Migration 30: backfill missing iconSize/glyphSize from iconBaseSize/glyphBaseSize
-- Description: Copy values from iconBaseSize -> iconSize and glyphBaseSize -> glyphSize
--             only when iconSize or glyphSize are NULL/empty. Do NOT drop legacy columns.

DO $$
BEGIN
  -- Ensure table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'Markers_Appearance'
  ) THEN

    -- Backfill iconSize when it is NULL or empty array, and iconBaseSize is present
    UPDATE "Markers_Appearance"
    SET "iconSize" = "iconBaseSize"
    WHERE (
      "iconSize" IS NULL
      OR array_length("iconSize", 1) IS NULL
      OR (array_length("iconSize", 1) = 0 AND "iconSize" = ARRAY[]::integer[])
    )
    AND "iconBaseSize" IS NOT NULL;

    -- Backfill glyphSize when it is NULL/empty and glyphBaseSize is present
    -- glyphBaseSize is an integer representing pixels; store as '<N>px'
    UPDATE "Markers_Appearance"
    SET "glyphSize" = ("glyphBaseSize"::text || 'px')
    WHERE (
      "glyphSize" IS NULL
      OR trim("glyphSize") = ''
    )
    AND "glyphBaseSize" IS NOT NULL;

  END IF;
END$$;

-- Verification query (run after migration):
-- SELECT COUNT(*) as remaining_iconBaseCandidates FROM "Markers_Appearance" WHERE "iconSize" IS NULL AND "iconBaseSize" IS NOT NULL;
-- SELECT COUNT(*) as remaining_glyphBaseCandidates FROM "Markers_Appearance" WHERE ("glyphSize" IS NULL OR trim("glyphSize") = '') AND "glyphBaseSize" IS NOT NULL;
