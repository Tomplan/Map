-- Allow super_admin and system_manager to insert user_roles for new users
-- This is needed for the user invitation flow

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;

-- Create new INSERT policy that allows:
-- 1. Users to insert their own role (bootstrap)
-- 2. Super admins to insert roles for new users (invitations)
-- 3. System managers to invite event managers
CREATE POLICY "Admins can invite users"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Allow self-insert for bootstrap
  auth.uid() = user_id
  OR
  -- Allow super_admin to invite anyone (uses SECURITY DEFINER function to avoid RLS recursion)
  public.current_user_role() = 'super_admin'
  OR
  -- Allow system_manager to invite event_managers only
  (
    public.current_user_role() = 'system_manager'
    AND role = 'event_manager'
  )
);
