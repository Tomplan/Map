-- Allow super admins and system managers to read all user roles
-- This enables the User Management interface to display all users

-- First, drop the old restrictive policies
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role via service" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can delete" ON public.user_roles;

-- Create a helper function that bypasses RLS to check admin status
-- SECURITY DEFINER allows it to read user_roles without triggering policies
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Policy: Users can read their own role OR admins can read all roles
CREATE POLICY "Users read own role or admins read all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.current_user_role() IN ('super_admin', 'system_manager')
);

-- Policy: Users can update their own role OR admins can update any role
CREATE POLICY "Users update own or admins update any"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR public.current_user_role() IN ('super_admin', 'system_manager')
);

-- Policy: Only super admins can delete user roles
CREATE POLICY "Super admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (
  public.current_user_role() = 'super_admin'
);
