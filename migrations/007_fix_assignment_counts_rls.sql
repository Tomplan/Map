-- Fix RLS policies for assignment_counts table
-- The trigger needs INSERT and UPDATE permissions but only SELECT policy exists

-- Add missing INSERT policy for assignment_counts
CREATE POLICY "Allow authenticated users to insert assignment_counts"
ON assignment_counts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Add missing UPDATE policy for assignment_counts
CREATE POLICY "Allow authenticated users to update assignment_counts"
ON assignment_counts FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verify the final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'assignment_counts'
ORDER BY policyname;