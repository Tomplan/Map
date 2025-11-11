-- Migration: Create Event_Subscriptions system
-- Purpose: Year-specific company participation with event logistics
-- Created: 2025-01-11

-- ============================================
-- 1. Add contact fields to companies table
-- ============================================
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS contact TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 2. Create event_subscriptions table
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    event_year INTEGER NOT NULL,

    -- Contact info (overrides company defaults if set)
    contact TEXT,
    phone TEXT,
    email TEXT,

    -- Booth requirements
    booth_count INTEGER DEFAULT 1,
    area TEXT, -- Location preference: "large field", "small field", etc.

    -- Meal counts per day
    breakfast_sat INTEGER DEFAULT 0,
    lunch_sat INTEGER DEFAULT 0,
    bbq_sat INTEGER DEFAULT 0,
    breakfast_sun INTEGER DEFAULT 0,
    lunch_sun INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,

    -- Notes
    notes TEXT,

    -- Metadata
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key
    CONSTRAINT fk_company FOREIGN KEY (company_id)
        REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Prevent duplicate subscriptions
    CONSTRAINT unique_company_year UNIQUE (company_id, event_year)
);

-- Add indexes for performance
CREATE INDEX idx_event_subscriptions_company ON public.event_subscriptions(company_id);
CREATE INDEX idx_event_subscriptions_year ON public.event_subscriptions(event_year);
CREATE INDEX idx_event_subscriptions_company_year ON public.event_subscriptions(company_id, event_year);

-- Add trigger for updated_at
CREATE TRIGGER update_event_subscriptions_updated_at BEFORE UPDATE
    ON public.event_subscriptions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Create event_subscriptions_archive table
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_subscriptions_archive (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    event_year INTEGER NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    booth_count INTEGER,
    area TEXT,
    breakfast_sat INTEGER,
    lunch_sat INTEGER,
    bbq_sat INTEGER,
    breakfast_sun INTEGER,
    lunch_sun INTEGER,
    coins INTEGER,
    notes TEXT,
    subscribed_at TIMESTAMPTZ,
    created_by TEXT,
    updated_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    archived_by TEXT
);

CREATE INDEX idx_event_subscriptions_archive_year ON public.event_subscriptions_archive(event_year);
CREATE INDEX idx_event_subscriptions_archive_company_year ON public.event_subscriptions_archive(company_id, event_year);

-- ============================================
-- 4. Enable Row Level Security (RLS)
-- ============================================

-- event_subscriptions: Public read, admin write
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event subscriptions"
    ON public.event_subscriptions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated admins can manage event subscriptions"
    ON public.event_subscriptions FOR ALL
    USING (auth.role() = 'authenticated');

-- event_subscriptions_archive: Admin only
ALTER TABLE public.event_subscriptions_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view subscription archive"
    ON public.event_subscriptions_archive FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admins can insert subscription archive"
    ON public.event_subscriptions_archive FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 5. Helper Functions
-- ============================================

-- Function to archive subscriptions for a given year
CREATE OR REPLACE FUNCTION archive_event_subscriptions(year_to_archive INTEGER, archived_by_user TEXT)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Copy to archive
    INSERT INTO public.event_subscriptions_archive (
        company_id, event_year, contact, phone, email,
        booth_count, area, breakfast_sat, lunch_sat, bbq_sat,
        breakfast_sun, lunch_sun, coins, notes,
        subscribed_at, created_by, updated_at, archived_by
    )
    SELECT
        company_id, event_year, contact, phone, email,
        booth_count, area, breakfast_sat, lunch_sat, bbq_sat,
        breakfast_sun, lunch_sun, coins, notes,
        subscribed_at, created_by, updated_at, archived_by_user
    FROM public.event_subscriptions
    WHERE event_year = year_to_archive;

    GET DIAGNOSTICS archived_count = ROW_COUNT;

    -- Delete from active subscriptions
    DELETE FROM public.event_subscriptions WHERE event_year = year_to_archive;

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES:
-- ============================================
-- After running this migration:
-- 1. Update UI to add Event Subscriptions tab
-- 2. Update Assignments tab to filter by subscribed companies
-- 3. Consider migrating existing Markers_Admin data to Event_Subscriptions
-- 4. Eventually deprecate Markers_Admin table
