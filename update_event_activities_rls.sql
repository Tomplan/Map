-- Update RLS policies for event_activities table to handle event_year column
-- Run this if event_year column already exists but RLS policies need updating

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view active event activities" ON event_activities;
DROP POLICY IF EXISTS "Admins can insert event activities" ON event_activities;
DROP POLICY IF EXISTS "Admins can update event activities" ON event_activities;
DROP POLICY IF EXISTS "Admins can delete event activities" ON event_activities;

-- Create new RLS policies that work with event_year
CREATE POLICY "Users can view active event activities" ON event_activities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert event activities" ON event_activities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update event activities" ON event_activities
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete event activities" ON event_activities
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'event_activities'
ORDER BY policyname;