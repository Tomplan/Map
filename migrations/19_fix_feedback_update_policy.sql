-- Fix feedback_requests UPDATE policy to use current_user_role() function
-- This avoids RLS recursion issues and allows admins to update request status

-- Drop the old UPDATE policy
DROP POLICY IF EXISTS "Users can update own requests, admins can update all" ON feedback_requests;

-- Create new UPDATE policy using the SECURITY DEFINER function
CREATE POLICY "Users can update own requests, admins can update all"
  ON feedback_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.current_user_role() IN ('super_admin', 'system_manager', 'event_manager')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.current_user_role() IN ('super_admin', 'system_manager', 'event_manager')
  );
