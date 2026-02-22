-- 016_create_event_markers_view.sql
-- This view consolidates the various marker tables into a single row per marker
-- with joined appearance, content, assignment/company info and subscription details.
-- It will allow the client to fetch all necessary marker data with one request.

create or replace view event_markers_view as
select
  mc.*,
  -- appearance fields (exclude id and event_year to avoid duplicates)
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
  mcont.name as content_name,
  mcont.logo as content_logo,
  mcont.website as content_website,
  mcont.info as content_info,
  -- assignments as a JSON array via lateral subquery (avoids grouping)
  (
    select json_agg(json_build_object(
      'assignmentId', a2.id,
      'companyId', a2.company_id,
      'name', c2.name,
      'logo', c2.logo,
      'website', c2.website,
      'info', c2.info
    ))
    from assignments a2
    left join companies c2 on c2.id = a2.company_id
    where a2.marker_id = mc.id and a2.event_year = mc.event_year
  ) as assignments,
  -- subscription fields for primary company (if any)
  es.contact as sub_contact,
  es.phone as sub_phone,
  es.email as sub_email,
  es.booth_count as sub_booth_count,
  es.area as sub_area,
  es.coins as sub_coins,
  es.breakfast_sat as sub_breakfast,
  es.lunch_sat as sub_lunch,
  es.bbq_sat as sub_bbq,
  -- include translations for the primary assigned company (if any)
  (select json_agg(json_build_object('language_code', t.language_code, 'info', t.info))
     from company_translations t
     where t.company_id = a.company_id) as company_translations
from markers_core mc
left join markers_appearance ma on ma.id = mc.id and ma.event_year = mc.event_year
left join markers_content mcont on mcont.id = mc.id and mcont.event_year = mc.event_year
left join assignments a on a.marker_id = mc.id and a.event_year = mc.event_year
left join companies c on c.id = a.company_id
left join event_subscriptions es on es.company_id = a.company_id and es.event_year = mc.event_year

-- make view queryable by event_year, but it already exposes that column from markers_core.
-- no indexes are needed other than the underlying tables'.
