-- Migration 000: Rename Organization_Profile to organization_profile
-- Purpose: Follow PostgreSQL naming conventions (lowercase with underscores)
-- Must run BEFORE other migrations that reference this table
-- Safe: Preserves all data, columns, indexes, and foreign keys

-- Rename the table
ALTER TABLE "Organization_Profile" RENAME TO organization_profile;

-- Update policies to reference new table name
DROP POLICY IF EXISTS "Allow public read access on Organization_Profile" ON organization_profile;
DROP POLICY IF EXISTS "Allow admin write access on Organization_Profile" ON organization_profile;
DROP POLICY IF EXISTS "Allow authenticated INSERT on Organization_Profile" ON organization_profile;

-- Recreate policies with correct references
CREATE POLICY "Allow public read access on organization_profile"
ON organization_profile
FOR SELECT
USING (true);

CREATE POLICY "Allow admin write access on organization_profile"
ON organization_profile
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'system_manager')
  )
);

CREATE POLICY "Allow authenticated INSERT on organization_profile"
ON organization_profile
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'system_manager')
  )
);

-- Update trigger to reference new table name
DROP TRIGGER IF EXISTS on_organization_profile_update ON organization_profile;

CREATE TRIGGER on_organization_profile_update
BEFORE UPDATE ON organization_profile
FOR EACH ROW
EXECUTE PROCEDURE public.handle_organization_profile_update();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully renamed Organization_Profile to organization_profile';
END $$;
