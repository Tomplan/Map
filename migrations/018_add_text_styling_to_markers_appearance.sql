-- Add text styling options to markers_appearance (camelCase for consistency)
ALTER TABLE markers_appearance ADD COLUMN IF NOT EXISTS "fontWeight" VARCHAR(50) DEFAULT NULL;
ALTER TABLE markers_appearance ADD COLUMN IF NOT EXISTS "fontStyle" VARCHAR(50) DEFAULT NULL;
ALTER TABLE markers_appearance ADD COLUMN IF NOT EXISTS "textDecoration" VARCHAR(50) DEFAULT NULL;
ALTER TABLE markers_appearance ADD COLUMN IF NOT EXISTS "fontFamily" VARCHAR(100) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN markers_appearance."fontWeight" IS 'Font weight for the marker glyph (e.g. normal, bold)';
COMMENT ON COLUMN markers_appearance."fontStyle" IS 'Font style for the marker glyph (e.g. normal, italic)';
COMMENT ON COLUMN markers_appearance."textDecoration" IS 'Text decoration for the marker glyph (e.g. none, underline)';
COMMENT ON COLUMN markers_appearance."fontFamily" IS 'Font family for the marker glyph (e.g. sans-serif, serif, monospace)';

-- Update the view to include these new columns
DROP VIEW IF EXISTS event_markers_view;

CREATE OR REPLACE VIEW event_markers_view AS
SELECT
    mc.id,
    mc.lat,
    mc.lng,
    mc.rectangle,
    mc.angle,
    mc.event_year,
    mc."coreLocked",
    -- appearance fields
    ma."iconUrl",
    ma."iconSize",
    ma."iconColor",
    ma."className",
    ma.prefix,
    ma.glyph,
    ma."glyphColor",
    ma."glyphSize",
    ma."shadowScale",
    ma."glyphAnchor",
    ma."appearanceLocked",
    ma."fontWeight",
    ma."fontStyle",
    ma."textDecoration",
    ma."fontFamily",
    mcont.name AS content_name,
    mcont.logo AS content_logo,
    mcont.website AS content_website,
    mcont.info AS content_info,
    -- aggregated assignments
    (SELECT json_agg(json_build_object(
        'assignmentId', a2.id,
        'companyId', a2.company_id,
        'name', c2.name,
        'logo', c2.logo,
        'website', c2.website,
        'info', c2.info
    )) FROM assignments a2
    LEFT JOIN companies c2 ON c2.id = a2.company_id
    WHERE a2.marker_id = mc.id AND a2.event_year = mc.event_year
    ) AS assignments,
    -- subscription info (from first assignment if any)
    es.contact AS sub_contact,
    es.phone AS sub_phone,
    es.email AS sub_email,
    es.booth_count AS sub_booth_count,
    es.area AS sub_area,
    es.coins AS sub_coins,
    es.breakfast_sat AS sub_breakfast,
    es.lunch_sat AS sub_lunch,
    es.bbq_sat AS sub_bbq,
    -- translations
    (SELECT json_agg(json_build_object('language_code', t.language_code, 'info', t.info))
     FROM company_translations t
     WHERE t.company_id = a.company_id) AS company_translations
FROM markers_core mc
LEFT JOIN markers_appearance ma ON ma.id = mc.id AND ma.event_year = mc.event_year
LEFT JOIN markers_content mcont ON mcont.id = mc.id AND mcont.event_year = mc.event_year
LEFT JOIN assignments a ON a.marker_id = mc.id AND a.event_year = mc.event_year
LEFT JOIN companies c ON c.id = a.company_id
LEFT JOIN event_subscriptions es ON es.company_id = a.company_id AND es.event_year = mc.event_year;

