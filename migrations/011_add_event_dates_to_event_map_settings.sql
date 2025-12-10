-- Add per-year event dates to event_map_settings so admins can configure
-- the event start & end dates per event year.

ALTER TABLE event_map_settings
  ADD COLUMN event_start_date DATE,
  ADD COLUMN event_end_date DATE;

COMMENT ON COLUMN event_map_settings.event_start_date IS 'Optional per-year event start date (YYYY-MM-DD)';
COMMENT ON COLUMN event_map_settings.event_end_date IS 'Optional per-year event end date (YYYY-MM-DD)';

-- Choice: allow event managers to update per-year event settings (including dates)
-- Expand existing RLS policy to include 'event_manager' role as a permitted manager.
-- If you prefer more restrictive rules (e.g. only allow updates to date fields), create a separate policy.

-- Recreate the policy to ensure it contains event_manager as well
DROP POLICY IF EXISTS "System managers and super admins can manage event map settings" ON event_map_settings;

CREATE POLICY "System & Event managers and super admins can manage event map settings"
ON event_map_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('system_manager', 'super_admin', 'event_manager')
  )
);

-- Note: some deployments may prefer the event_manager role to have limited
-- permissions only; adjust RLS policies accordingly if required.
