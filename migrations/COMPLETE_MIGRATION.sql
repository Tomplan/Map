-- ============================================
-- COMPLETE MIGRATION - RUN THIS ONCE
-- Creates tables, migrates data, sets up RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Create Tables
-- ============================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.Companies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.Companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.Companies(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.Companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE
    ON public.Companies FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Create Assignments Table
CREATE TABLE IF NOT EXISTS public.Assignments (
    id BIGSERIAL PRIMARY KEY,
    marker_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    event_year INTEGER NOT NULL,
    booth_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,

    -- Foreign keys
    CONSTRAINT fk_marker FOREIGN KEY (marker_id)
        REFERENCES public.Markers_Core(id) ON DELETE CASCADE,
    CONSTRAINT fk_company FOREIGN KEY (company_id)
        REFERENCES public.Companies(id) ON DELETE CASCADE,

    -- Prevent duplicate assignments
    CONSTRAINT unique_assignment UNIQUE (marker_id, company_id, event_year)
);

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS idx_assignments_marker ON public.Assignments(marker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_company ON public.Assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_year ON public.Assignments(event_year);
CREATE INDEX IF NOT EXISTS idx_assignments_marker_year ON public.Assignments(marker_id, event_year);

-- 3. Create Assignments Archive
CREATE TABLE IF NOT EXISTS public.Assignments_Archive (
    id BIGSERIAL PRIMARY KEY,
    marker_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    event_year INTEGER NOT NULL,
    booth_number TEXT,
    created_at TIMESTAMPTZ,
    created_by TEXT,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_archive_year ON public.Assignments_Archive(event_year);
CREATE INDEX IF NOT EXISTS idx_assignments_archive_marker ON public.Assignments_Archive(marker_id, event_year);

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
    INSERT INTO public.Assignments_Archive (
        marker_id, company_id, event_year, booth_number, created_at, created_by
    )
    SELECT
        marker_id, company_id, event_year, booth_number, created_at, created_by
    FROM public.Assignments
    WHERE event_year = year_to_archive;

    GET DIAGNOSTICS archived_count = ROW_COUNT;

    -- Delete from active assignments
    DELETE FROM public.Assignments WHERE event_year = year_to_archive;

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: Migrate Data
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
-- PART 4: Set Up RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.Companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Assignments_Archive ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

DROP POLICY IF EXISTS "Authenticated admins can view archive" ON public.Assignments_Archive;
DROP POLICY IF EXISTS "Authenticated admins can insert archive" ON public.Assignments_Archive;

-- Create RLS policies for Companies
CREATE POLICY "Public can view companies"
    ON public.Companies
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert companies"
    ON public.Companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
    ON public.Companies
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies"
    ON public.Companies
    FOR DELETE
    TO authenticated
    USING (true);

-- Create RLS policies for Assignments
CREATE POLICY "Public can view assignments"
    ON public.Assignments
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert assignments"
    ON public.Assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
    ON public.Assignments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete assignments"
    ON public.Assignments
    FOR DELETE
    TO authenticated
    USING (true);

-- Create RLS policies for Archive (Admin only)
CREATE POLICY "Authenticated admins can view archive"
    ON public.Assignments_Archive FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can insert archive"
    ON public.Assignments_Archive FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PART 5: Verify Migration
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
-- PART 6: Test Query
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
