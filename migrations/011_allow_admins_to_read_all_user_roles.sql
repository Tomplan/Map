-- Allow super admins and system managers to read all user roles
-- This enables the User Management interface to display all users

-- First, drop the old restrictive policies
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role via service" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can delete" ON public.user_roles;

-- Create a helper function to check if current user is admin
-- This avoids infinite recursion by using a direct query to the table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can read their own role OR admins can read all roles
CREATE POLICY "Users read own role or admins read all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- Policy: Users can update their own role OR admins can update any role
CREATE POLICY "Users update own or admins update any"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- Policy: Only super admins can delete user roles
CREATE POLICY "Super admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    LIMIT 1
  )
);
