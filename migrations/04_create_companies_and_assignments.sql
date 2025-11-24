-- Migration: Create Companies and Assignments tables
-- Purpose: Separate companies from markers, enable yearly assignments
-- Created: 2025-01-10

-- ============================================
-- 1. Create Companies Table (Permanent)
-- ============================================
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
CREATE INDEX idx_companies_name ON public.Companies(name);
CREATE INDEX idx_companies_created_at ON public.Companies(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE
    ON public.Companies FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Create Assignments Table (Yearly)
-- ============================================
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
CREATE INDEX idx_assignments_marker ON public.Assignments(marker_id);
CREATE INDEX idx_assignments_company ON public.Assignments(company_id);
CREATE INDEX idx_assignments_year ON public.Assignments(event_year);
CREATE INDEX idx_assignments_marker_year ON public.Assignments(marker_id, event_year);

-- ============================================
-- 3. Create Assignments Archive (Historical)
-- ============================================
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

CREATE INDEX idx_assignments_archive_year ON public.Assignments_Archive(event_year);
CREATE INDEX idx_assignments_archive_marker ON public.Assignments_Archive(marker_id, event_year);

-- ============================================
-- 4. Migrate existing Markers_Content to Companies
-- ============================================
-- This will be run separately after table creation
-- See migration script 002_migrate_data.sql

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================

-- Companies: Public read, admin write
ALTER TABLE public.Companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view companies"
    ON public.Companies FOR SELECT
    USING (true);

CREATE POLICY "Authenticated admins can manage companies"
    ON public.Companies FOR ALL
    USING (auth.role() = 'authenticated');

-- Assignments: Public read current year, admin write
ALTER TABLE public.Assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view current year assignments"
    ON public.Assignments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated admins can manage assignments"
    ON public.Assignments FOR ALL
    USING (auth.role() = 'authenticated');

-- Assignments Archive: Admin only
ALTER TABLE public.Assignments_Archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view archive"
    ON public.Assignments_Archive FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can insert archive"
    ON public.Assignments_Archive FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 6. Helper Functions
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
-- NOTES:
-- ============================================
-- After running this migration:
-- 1. Run migration 002 to migrate data from Markers_Content
-- 2. Update application code to use new structure
-- 3. Eventually deprecate Markers_Content table
-- 4. Update contentLocked to be managed differently (per-assignment or per-company)
