-- Fix Organization_Profile RLS policy for admin write access
-- SECURITY: Use user_roles table instead of user_metadata (which is user-editable)
-- Requires migration 008 to create user_roles table first

-- Drop the old admin write policy
DROP POLICY IF EXISTS "Allow admin write access on Organization_Profile" ON "Organization_Profile";

-- Create new policy that checks user_roles table (secure)
CREATE POLICY "Allow admin write access on Organization_Profile"
ON "Organization_Profile"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'system_manager', 'event_manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'system_manager', 'event_manager')
  )
);
