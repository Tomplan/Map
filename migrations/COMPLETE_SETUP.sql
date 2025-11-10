-- ============================================
-- COMPLETE SETUP: Create Tables, RLS, and Migrate Data
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Create Tables
-- ============================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE
    ON public.companies FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id BIGSERIAL PRIMARY KEY,
    marker_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    event_year INTEGER NOT NULL,
    booth_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,

    -- Foreign keys
    CONSTRAINT fk_marker FOREIGN KEY (marker_id)
        REFERENCES public."Markers_Core"(id) ON DELETE CASCADE,
    CONSTRAINT fk_company FOREIGN KEY (company_id)
        REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Prevent duplicate assignments
    CONSTRAINT unique_assignment UNIQUE (marker_id, company_id, event_year)
);

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS idx_assignments_marker ON public.assignments(marker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_company ON public.assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_year ON public.assignments(event_year);
CREATE INDEX IF NOT EXISTS idx_assignments_marker_year ON public.assignments(marker_id, event_year);

-- 3. Create Assignments Archive
CREATE TABLE IF NOT EXISTS public.assignments_archive (
    id BIGSERIAL PRIMARY KEY,
    marker_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    event_year INTEGER NOT NULL,
    booth_number TEXT,
    created_at TIMESTAMPTZ,
    created_by TEXT,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_archive_year ON public.assignments_archive(event_year);
CREATE INDEX IF NOT EXISTS idx_assignments_archive_marker ON public.assignments_archive(marker_id, event_year);

-- ============================================
-- PART 2: Helper Functions
-- ============================================

-- Function to archive assignments for a given year
CREATE OR REPLACE FUNCTION archive_assignments(year_to_archive INTEGER)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Copy to archive
    INSERT INTO public.assignments_archive (
        marker_id, company_id, event_year, booth_number, created_at, created_by
    )
    SELECT
        marker_id, company_id, event_year, booth_number, created_at, created_by
    FROM public.assignments
    WHERE event_year = year_to_archive;

    GET DIAGNOSTICS archived_count = ROW_COUNT;

    -- Delete from active assignments
    DELETE FROM public.assignments WHERE event_year = year_to_archive;

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: Configure RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_archive ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public can view companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON public.companies;

DROP POLICY IF EXISTS "Public can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Public can view current year assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated admins can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON public.assignments;

DROP POLICY IF EXISTS "Authenticated admins can view archive" ON public.assignments_archive;
DROP POLICY IF EXISTS "Authenticated admins can insert archive" ON public.assignments_archive;

-- Create RLS policies for Companies
CREATE POLICY "Public can view companies"
    ON public.companies
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert companies"
    ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
    ON public.companies
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies"
    ON public.companies
    FOR DELETE
    TO authenticated
    USING (true);

-- Create RLS policies for Assignments
CREATE POLICY "Public can view assignments"
    ON public.assignments
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert assignments"
    ON public.assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
    ON public.assignments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete assignments"
    ON public.assignments
    FOR DELETE
    TO authenticated
    USING (true);

-- Create RLS policies for Archive (Admin only)
CREATE POLICY "Authenticated admins can view archive"
    ON public.assignments_archive FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can insert archive"
    ON public.assignments_archive FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PART 4: Migrate Data
-- ============================================

-- Step 1: Migrate Companies from Markers_Content
INSERT INTO public.companies (name, logo, website, info)
SELECT DISTINCT ON (name, logo, website, info)
    name,
    logo,
    website,
    info
FROM public."Markers_Content"
WHERE name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.name = "Markers_Content".name
    AND COALESCE(c.logo, '') = COALESCE("Markers_Content".logo, '')
    AND COALESCE(c.website, '') = COALESCE("Markers_Content".website, '')
    AND COALESCE(c.info, '') = COALESCE("Markers_Content".info, '')
  )
ORDER BY name, logo, website, info;

-- Step 2: Create Assignments for 2025
INSERT INTO public.assignments (marker_id, company_id, event_year, booth_number, created_by)
SELECT
    mc.id as marker_id,
    c.id as company_id,
    2025 as event_year,
    mc."boothNumber" as booth_number,
    'system_migration' as created_by
FROM public."Markers_Content" mc
JOIN public.companies c ON (
    mc.name = c.name
    AND COALESCE(mc.logo, '') = COALESCE(c.logo, '')
    AND COALESCE(mc.website, '') = COALESCE(c.website, '')
    AND COALESCE(mc.info, '') = COALESCE(c.info, '')
)
WHERE mc.name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.marker_id = mc.id
    AND a.company_id = c.id
    AND a.event_year = 2025
  );

-- ============================================
-- PART 5: Verify Migration
-- ============================================
DO $$
DECLARE
    content_count INTEGER;
    company_count INTEGER;
    assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO content_count FROM public."Markers_Content" WHERE name IS NOT NULL;
    SELECT COUNT(*) INTO company_count FROM public.companies;
    SELECT COUNT(*) INTO assignment_count FROM public.assignments WHERE event_year = 2025;

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
-- PART 6: Test Query
-- ============================================
SELECT
    m.id as marker_id,
    m.lat,
    m.lng,
    a.booth_number,
    c.name as company_name,
    c.logo
FROM "Markers_Core" m
LEFT JOIN Assignments a ON m.id = a.marker_id AND a.event_year = 2025
LEFT JOIN Companies c ON a.company_id = c.id
LIMIT 5;
