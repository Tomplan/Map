-- Fix assignment_counts: replace trigger-based table with a live view that
-- only counts assignments pointing to markers that actually exist for the year.
--
-- Problem: The trigger-based table (migration 021) counted ALL assignment rows,
-- including orphaned assignments whose marker_id no longer exists in markers_core.
-- This made the dashboard "Total Assignments" number higher than the actual
-- assignments shown in the Assignments tab (which filters by valid markers).
--
-- Solution: A live VIEW that joins with markers_core, matching the query used
-- by useAssignments.js. No trigger needed — the count hook already refetches
-- from the base table's realtime channel on every change.

-- 1. Remove the trigger (no longer needed for counting)
DROP TRIGGER IF EXISTS trigger_assignment_count ON assignments;

-- 2. Drop whatever exists with that name (table from 021, or view from 022)
DROP TABLE IF EXISTS assignment_counts CASCADE;
DROP VIEW IF EXISTS assignment_counts CASCADE;

-- 3. Create a live view that only counts assignments with valid markers
CREATE VIEW assignment_counts AS
SELECT
  a.event_year,
  COUNT(*) AS count
FROM assignments a
INNER JOIN markers_core m
  ON a.marker_id = m.id
  AND a.event_year = m.event_year
GROUP BY a.event_year;

-- 4. Allow authenticated reads (required for Supabase client queries)
GRANT SELECT ON assignment_counts TO authenticated;

-- 5. Clean up the orphaned trigger function
DROP FUNCTION IF EXISTS update_assignment_count();
