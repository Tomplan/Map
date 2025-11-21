-- Allow super admins and system managers to read all user roles
-- This enables the User Management interface to display all users

-- Add policy for admins to read all roles
CREATE POLICY "Admins can read all user roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_manager')
  )
);

-- Add policy for admins to update any user role (not just their own)
CREATE POLICY "Admins can update any user role"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_manager')
  )
);

-- Add policy for admins to delete any user role
CREATE POLICY "Admins can delete any user role"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);
