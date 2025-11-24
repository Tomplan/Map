-- Migration 022: Ensure consistent admin roles for event_activities and user_roles
-- Purpose: Some policies referenced 'content_editor' while the user_roles table allowed 'event_manager', causing legitimate admins to be blocked.

BEGIN;

-- Expand the user_roles check constraint to allow both event_manager and content_editor
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (role IN ('super_admin', 'system_manager', 'event_manager', 'content_editor'));

-- Make sure the event_activities policy accepts both role names
DROP POLICY IF EXISTS "Admins can manage activities" ON public.event_activities;
CREATE POLICY "Admins can manage activities"
  ON public.event_activities FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager', 'content_editor')
    )
  );

COMMIT;
