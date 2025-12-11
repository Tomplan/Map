-- Migration: Add RPC to update category sort order in a single transaction
-- Run this migration to create an RPC function that takes a JSONB array
-- of objects { id, sort_order } and applies updates to the categories table

CREATE OR REPLACE FUNCTION public.update_category_order(updates jsonb)
RETURNS void AS $$
BEGIN
  UPDATE categories c
  SET sort_order = j.sort_order
  FROM (
    -- Cast 'id' to UUID to match the categories.id column type
    SELECT (el->>'id')::uuid AS id, (el->>'sort_order')::integer AS sort_order
    FROM jsonb_array_elements(updates) el
  ) AS j
  WHERE c.id = j.id;
END;
$$ LANGUAGE plpgsql;
