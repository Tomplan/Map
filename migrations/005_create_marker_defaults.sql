-- Migration: Create default marker records for booth markers (ID < 1000)
-- These records store global defaults for assigned (-1) and unassigned (-2) booth markers
-- Individual marker values in regular records will override these defaults

-- Create default records in Markers_Core
-- These store rectangle dimensions and other core properties
INSERT INTO public.Markers_Core (id, lat, lng, type, angle, rectWidth, rectHeight, coreLocked)
VALUES
  -- ID -1: Assigned booth defaults (rectangle represents physical booth space)
  (-1, 0, 0, 'booth', 0, 6, 6, true),

  -- ID -2: Unassigned booth defaults (same size - booth space doesn't change)
  (-2, 0, 0, 'booth', 0, 6, 6, true)
ON CONFLICT (id) DO NOTHING;

-- Create default records in Markers_Appearance
-- These store visual styling properties (icons, glyphs, colors)
INSERT INTO public.Markers_Appearance (
  id,
  iconUrl,
  iconSize,
  iconColor,
  className,
  prefix,
  glyph,
  glyphColor,
  glyphSize,
  glyphAnchor,
  appearanceLocked
)
VALUES
  -- ID -1: Assigned booth defaults (blue marker)
  (
    -1,
    'glyph-marker-icon-blue.svg',
    '{25,41}',  -- Standard Leaflet marker size
    NULL,
    'leaflet-marker-icon',
    '',
    '',  -- No default glyph (each marker sets its own booth number)
    'white',
    14,
    '{0.5,1}',  -- Center bottom anchor
    true  -- Locked to prevent accidental changes
  ),

  -- ID -2: Unassigned booth defaults (gray marker)
  (
    -2,
    'glyph-marker-icon-gray.svg',
    '{25,41}',
    NULL,
    'leaflet-marker-icon',
    '',
    '',
    'white',
    14,
    '{0.5,1}',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the defaults were created
SELECT
  id,
  CASE
    WHEN id = -1 THEN 'Assigned Booth Default'
    WHEN id = -2 THEN 'Unassigned Booth Default'
  END as description,
  iconUrl,
  glyphColor,
  glyphSize
FROM public.Markers_Appearance
WHERE id IN (-1, -2)
ORDER BY id DESC;

SELECT
  id,
  CASE
    WHEN id = -1 THEN 'Assigned Booth Default'
    WHEN id = -2 THEN 'Unassigned Booth Default'
  END as description,
  rectWidth,
  rectHeight,
  angle
FROM public.Markers_Core
WHERE id IN (-1, -2)
ORDER BY id DESC;
