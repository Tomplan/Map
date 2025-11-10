-- ============================================
-- SETUP RLS AND MIGRATE DATA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Configure RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.Companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Assignments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public can view companies" ON public.Companies;
DROP POLICY IF EXISTS "Authenticated admins can manage companies" ON public.Companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.Companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.Companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON public.Companies;

DROP POLICY IF EXISTS "Public can view assignments" ON public.Assignments;
DROP POLICY IF EXISTS "Public can view current year assignments" ON public.Assignments;
DROP POLICY IF EXISTS "Authenticated admins can manage assignments" ON public.Assignments;
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.Assignments;
DROP POLICY IF EXISTS "Authenticated users can update assignments" ON public.Assignments;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON public.Assignments;

-- Create RLS policies for Companies
-- Public can view all companies
CREATE POLICY "Public can view companies"
    ON public.Companies
    FOR SELECT
    USING (true);

-- Authenticated users can insert companies
CREATE POLICY "Authenticated users can insert companies"
    ON public.Companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can update companies
CREATE POLICY "Authenticated users can update companies"
    ON public.Companies
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete companies
CREATE POLICY "Authenticated users can delete companies"
    ON public.Companies
    FOR DELETE
    TO authenticated
    USING (true);

-- Create RLS policies for Assignments
-- Public can view all assignments
CREATE POLICY "Public can view assignments"
    ON public.Assignments
    FOR SELECT
    USING (true);

-- Authenticated users can insert assignments
CREATE POLICY "Authenticated users can insert assignments"
    ON public.Assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can update assignments
CREATE POLICY "Authenticated users can update assignments"
    ON public.Assignments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete assignments
CREATE POLICY "Authenticated users can delete assignments"
    ON public.Assignments
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- PART 2: Migrate Data
-- ============================================

-- Step 1: Migrate Companies from Markers_Content
INSERT INTO public.Companies (name, logo, website, info)
SELECT DISTINCT ON (name, logo, website, info)
    name,
    logo,
    website,
    info
FROM public.Markers_Content
WHERE name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.Companies c
    WHERE c.name = Markers_Content.name
    AND COALESCE(c.logo, '') = COALESCE(Markers_Content.logo, '')
    AND COALESCE(c.website, '') = COALESCE(Markers_Content.website, '')
    AND COALESCE(c.info, '') = COALESCE(Markers_Content.info, '')
  )
ORDER BY name, logo, website, info;

-- Step 2: Create Assignments for 2025
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
WHERE mc.name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.Assignments a
    WHERE a.marker_id = mc.id
    AND a.company_id = c.id
    AND a.event_year = 2025
  );

-- ============================================
-- PART 3: Verify Migration
-- ============================================
DO $$
DECLARE
    content_count INTEGER;
    company_count INTEGER;
    assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO content_count FROM public.Markers_Content WHERE name IS NOT NULL;
    SELECT COUNT(*) INTO company_count FROM public.Companies;
    SELECT COUNT(*) INTO assignment_count FROM public.Assignments WHERE event_year = 2025;

    RAISE NOTICE '=================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Markers_Content entries: %', content_count;
    RAISE NOTICE 'Companies created: %', company_count;
    RAISE NOTICE 'Assignments created: %', assignment_count;
    RAISE NOTICE '=================================';

    IF assignment_count = 0 THEN
        RAISE WARNING 'No assignments created! Check if Companies table is empty.';
    ELSIF assignment_count != content_count THEN
        RAISE WARNING 'Assignment count (%) does not match content count (%)!', assignment_count, content_count;
    ELSE
        RAISE NOTICE '✅ Migration successful!';
    END IF;
END $$;

-- ============================================
-- PART 4: Test Query
-- ============================================
SELECT
    m.id as marker_id,
    m.lat,
    m.lng,
    a.booth_number,
    c.name as company_name,
    c.logo
FROM Markers_Core m
LEFT JOIN Assignments a ON m.id = a.marker_id AND a.event_year = 2025
LEFT JOIN Companies c ON a.company_id = c.id
LIMIT 5;
