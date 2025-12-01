-- Fix RLS policies for all count tables
-- These tables are used by triggers and need INSERT/UPDATE permissions

-- Fix subscription_counts
CREATE POLICY "Allow authenticated users to insert subscription_counts"
ON subscription_counts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update subscription_counts"
ON subscription_counts FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix marker_counts
CREATE POLICY "Allow authenticated users to insert marker_counts"
ON marker_counts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update marker_counts"
ON marker_counts FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix company_counts
CREATE POLICY "Allow authenticated users to insert company_counts"
ON company_counts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update company_counts"
ON company_counts FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verify all count table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('assignment_counts', 'subscription_counts', 'marker_counts', 'company_counts')
ORDER BY tablename, cmd;