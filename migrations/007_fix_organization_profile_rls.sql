-- Fix Organization_Profile RLS policy for admin write access
-- The existing policy checks auth.role() which is PostgreSQL role, not our custom user role
-- We need to check the user_metadata.role instead

-- Drop the old admin write policy
DROP POLICY IF EXISTS "Allow admin write access on Organization_Profile" ON "Organization_Profile";

-- Create new policy that checks user_metadata for admin roles
CREATE POLICY "Allow admin write access on Organization_Profile"
ON "Organization_Profile"
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'system_manager', 'event_manager')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'system_manager', 'event_manager')
  )
);
