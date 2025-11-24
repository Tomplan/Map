-- IMPORTANT: Run this AFTER 04_create_companies_and_assignments.sql
-- ============================================

-- Insert unique companies from Markers_Content
-- Group by company details to avoid duplicates
INSERT INTO public.Companies (name, logo, website, info)
SELECT DISTINCT ON (name, logo, website, info)
    name,
    logo,
    website,
    info
FROM public.Markers_Content
WHERE name IS NOT NULL
ORDER BY name, logo, website, info;

-- ============================================
-- 2. Create Assignments for current year (2025)
-- ============================================

-- Create assignments linking existing markers to newly created companies
-- Match by name, logo, website, and info to find the right company
INSERT INTO public.Assignments (marker_id, company_id, event_year, booth_number, created_by)
SELECT
    mc.id as marker_id,
    c.id as company_id,
    2025 as event_year,
    mc.boothNumber as booth_number,
    'system_migration' as created_by
FROM public.Markers_Content mc
JOIN public.Companies c ON (
    mc.name = c.name
    AND COALESCE(mc.logo, '') = COALESCE(c.logo, '')
    AND COALESCE(mc.website, '') = COALESCE(c.website, '')
    AND COALESCE(mc.info, '') = COALESCE(c.info, '')
)
WHERE mc.name IS NOT NULL;

-- ============================================
-- 3. Verification Queries
-- ============================================

-- Check counts
DO $$
DECLARE
    content_count INTEGER;
    company_count INTEGER;
    assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO content_count FROM public.Markers_Content WHERE name IS NOT NULL;
    SELECT COUNT(*) INTO company_count FROM public.Companies;
    SELECT COUNT(*) INTO assignment_count FROM public.Assignments WHERE event_year = 2025;

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Markers_Content entries with names: %', content_count;
    RAISE NOTICE '  Companies created: %', company_count;
    RAISE NOTICE '  Assignments created for 2025: %', assignment_count;

    IF assignment_count != content_count THEN
        RAISE WARNING 'Assignment count does not match content count! Please review.';
    END IF;
END $$;

-- ============================================
-- 4. OPTIONAL: Backup Markers_Content
-- ============================================

-- Uncomment to create backup before eventual deletion
-- CREATE TABLE IF NOT EXISTS public.Markers_Content_Backup AS
-- SELECT * FROM public.Markers_Content;

-- ============================================
-- NOTES:
-- ============================================
-- After verifying migration success:
-- 1. Update application code to use Companies and Assignments
-- 2. Test thoroughly in development
-- 3. Consider keeping Markers_Content for a while as backup
-- 4. Eventually drop Markers_Content table when confident
