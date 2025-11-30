-- Migration: Add event_year column to event_activities table
-- This makes program management per-year like assignments and subscriptions

-- Add event_year column with default value for existing data
ALTER TABLE event_activities
ADD COLUMN event_year INTEGER DEFAULT 2025;

-- Create index for performance
CREATE INDEX idx_event_activities_event_year ON event_activities(event_year);

-- Update RLS policies to include event_year filtering
-- Note: You'll need to update existing RLS policies in Supabase dashboard
-- to ensure proper access control for year-specific data

-- Optional: Create archive table for event activities (similar to assignments_archive)
CREATE TABLE IF NOT EXISTS event_activities_archive (
  id SERIAL PRIMARY KEY,
  event_year INTEGER NOT NULL,
  day TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  display_order INTEGER,
  title_nl TEXT,
  title_en TEXT,
  title_de TEXT,
  description_nl TEXT,
  description_en TEXT,
  description_de TEXT,
  location_type TEXT DEFAULT 'venue',
  company_id INTEGER REFERENCES companies(id),
  location_nl TEXT,
  location_en TEXT,
  location_de TEXT,
  badge_nl TEXT,
  badge_en TEXT,
  badge_de TEXT,
  is_active BOOLEAN DEFAULT true,
  show_location_type_badge BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by TEXT
);

-- Enable RLS on archive table
ALTER TABLE event_activities_archive ENABLE ROW LEVEL SECURITY;

-- Create function to archive event activities for a specific year
CREATE OR REPLACE FUNCTION archive_event_activities(year_to_archive INTEGER, archived_by_user TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Insert current year's activities into archive
  INSERT INTO event_activities_archive (
    event_year, day, start_time, end_time, display_order,
    title_nl, title_en, title_de,
    description_nl, description_en, description_de,
    location_type, company_id,
    location_nl, location_en, location_de,
    badge_nl, badge_en, badge_de,
    is_active, show_location_type_badge,
    archived_by
  )
  SELECT
    event_year, day, start_time, end_time, display_order,
    title_nl, title_en, title_de,
    description_nl, description_en, description_de,
    location_type, company_id,
    location_nl, location_en, location_de,
    badge_nl, badge_en, badge_de,
    is_active, show_location_type_badge,
    archived_by_user
  FROM event_activities
  WHERE event_year = year_to_archive;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Delete archived activities from main table
  DELETE FROM event_activities WHERE event_year = year_to_archive;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION archive_event_activities(INTEGER, TEXT) TO authenticated;

-- Create RLS policy for archive table (admin only)
CREATE POLICY "Admin can view event activities archive" ON event_activities_archive
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert event activities archive" ON event_activities_archive
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update RLS policies for event_activities table to handle event_year
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view active event activities" ON event_activities;
DROP POLICY IF EXISTS "Admins can insert event activities" ON event_activities;
DROP POLICY IF EXISTS "Admins can update event activities" ON event_activities;
DROP POLICY IF EXISTS "Admins can delete event activities" ON event_activities;

-- Create new RLS policies that work with event_year
CREATE POLICY "Users can view active event activities" ON event_activities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert event activities" ON event_activities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update event activities" ON event_activities
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete event activities" ON event_activities
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the migration
-- SELECT COUNT(*) as activities_count FROM event_activities;
-- SELECT event_year, COUNT(*) as count_per_year FROM event_activities GROUP BY event_year ORDER BY event_year;