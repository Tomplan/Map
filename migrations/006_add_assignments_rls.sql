-- Add Row Level Security policies for assignments table
-- This ensures authenticated users can manage assignments

-- Enable RLS on assignments table (if not already enabled)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all assignments
CREATE POLICY "Users can view assignments"
ON assignments FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert assignments
CREATE POLICY "Users can insert assignments"
ON assignments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update assignments
CREATE POLICY "Users can update assignments"
ON assignments FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete assignments
CREATE POLICY "Users can delete assignments"
ON assignments FOR DELETE
USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'assignments'
ORDER BY policyname;