-- Migration: Add per-marker base sizing fields to Markers_Appearance

-- Add columns:
-- icon_base_size - integer[] stores base width/height for each marker
-- glyph_base_size - integer stores a base font size in pixels for the glyph
-- shadow_scale - numeric multiplier used to tweak shadow size if necessary

DO $$
BEGIN
  -- Only proceed if the table exists (covers different environments / ordering)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name = 'markers_appearance' OR table_name = 'Markers_Appearance')
  ) THEN

    -- Use the quoted mixed-case name (matches existing migrations which insert defaults)
    ALTER TABLE public."Markers_Appearance"
      ADD COLUMN IF NOT EXISTS "iconBaseSize" integer[],
      ADD COLUMN IF NOT EXISTS "glyphBaseSize" integer,
      ADD COLUMN IF NOT EXISTS "shadowScale" numeric;

    -- Backfill default values for existing default rows (-1 and -2)
    -- Use regexp_replace to strip non-numeric characters (e.g. '12px') and safely cast
    UPDATE public."Markers_Appearance"
    SET "iconBaseSize" = COALESCE("iconBaseSize", "iconSize"),
        "glyphBaseSize" = COALESCE("glyphBaseSize",
          CASE
            WHEN "glyphSize" IS NOT NULL AND regexp_replace("glyphSize", '[^0-9]', '', 'g') <> ''
              THEN (regexp_replace("glyphSize", '[^0-9]', '', 'g'))::integer
            ELSE NULL
          END
        ),
        "shadowScale" = COALESCE("shadowScale", 1.0)
    WHERE id IN (-1, -2);

    -- For other rows, backfill where missing; use NULLIF to avoid casting empty strings
    UPDATE public."Markers_Appearance"
    SET "iconBaseSize" = COALESCE("iconBaseSize", "iconSize"),
        "glyphBaseSize" = COALESCE(
          "glyphBaseSize",
          NULLIF(regexp_replace("glyphSize", '[^0-9]', '', 'g'), '')::integer
        ),
        "shadowScale" = COALESCE("shadowScale", 1.0)
    WHERE "iconBaseSize" IS NULL OR "glyphBaseSize" IS NULL OR "shadowScale" IS NULL;

    -- Add column comments to help future readers (idempotent)
    COMMENT ON COLUMN public."Markers_Appearance"."iconBaseSize" IS 'Optional base icon size per marker [width,height] - used to compute scaled icon sizes';
    COMMENT ON COLUMN public."Markers_Appearance"."glyphBaseSize" IS 'Optional base glyph font-size (px) for per-marker glyph sizing';
    COMMENT ON COLUMN public."Markers_Appearance"."shadowScale" IS 'Optional multiplier for shadow sizing relative to icon size (default 1.0)';

  ELSE
    RAISE NOTICE 'Markers_Appearance table not present in this database — skipping migration 29_add_marker_base_sizes.sql';
  END IF;
END$$;

-- (Comments are applied inside the DO block using the quoted table name; nothing to do here)

-- Done
