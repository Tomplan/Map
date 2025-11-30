-- Add event_year column to marker tables to make markers year-specific
-- This allows different markers, positions, and styling per event year

-- Add event_year column to markers_core table (create table if it doesn't exist)
DO $$
BEGIN
    -- Create markers_core table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'markers_core') THEN
        CREATE TABLE markers_core (
            id INTEGER PRIMARY KEY,
            event_year INTEGER DEFAULT 2025,
            lat DECIMAL(10,8),
            lng DECIMAL(11,8),
            rectangle JSONB,
            angle DECIMAL(5,2) DEFAULT 0,
            rectWidth INTEGER DEFAULT 40,
            rectHeight INTEGER DEFAULT 40,
            coreLocked BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add event_year column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markers_core' AND column_name = 'event_year') THEN
            ALTER TABLE markers_core ADD COLUMN event_year INTEGER DEFAULT 2025;
        END IF;
    END IF;
END $$;

-- Add event_year column to markers_appearance table (create table if it doesn't exist)
DO $$
BEGIN
    -- Create markers_appearance table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'markers_appearance') THEN
        CREATE TABLE markers_appearance (
            id INTEGER PRIMARY KEY,
            event_year INTEGER DEFAULT 2025,
            iconUrl TEXT,
            iconSize JSONB DEFAULT '[24,24]',
            glyph TEXT,
            glyphColor TEXT DEFAULT '#000000',
            glyphSize TEXT DEFAULT '12px',
            glyphAnchor JSONB DEFAULT '[12,12]',
            shadowScale DECIMAL(3,2) DEFAULT 1.0,
            appearanceLocked BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add event_year column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markers_appearance' AND column_name = 'event_year') THEN
            ALTER TABLE markers_appearance ADD COLUMN event_year INTEGER DEFAULT 2025;
        END IF;
    END IF;
END $$;

-- Add event_year column to markers_content table (create table if it doesn't exist)
DO $$
BEGIN
    -- Create markers_content table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'markers_content') THEN
        CREATE TABLE markers_content (
            id INTEGER PRIMARY KEY,
            event_year INTEGER DEFAULT 2025,
            name TEXT,
            logo TEXT,
            website TEXT,
            info TEXT,
            contentLocked BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add event_year column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markers_content' AND column_name = 'event_year') THEN
            ALTER TABLE markers_content ADD COLUMN event_year INTEGER DEFAULT 2025;
        END IF;
    END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_markers_core_event_year ON markers_core(event_year);
CREATE INDEX IF NOT EXISTS idx_markers_appearance_event_year ON markers_appearance(event_year);
CREATE INDEX IF NOT EXISTS idx_markers_content_event_year ON markers_content(event_year);

-- Create archive tables for markers (similar to event_activities_archive)
CREATE TABLE IF NOT EXISTS markers_core_archive (
  id SERIAL PRIMARY KEY,
  original_id INTEGER,
  event_year INTEGER NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  rectangle JSONB,
  angle DECIMAL(5,2),
  rectWidth INTEGER,
  rectHeight INTEGER,
  coreLocked BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by TEXT
);

CREATE TABLE IF NOT EXISTS markers_appearance_archive (
  id SERIAL PRIMARY KEY,
  original_id INTEGER,
  event_year INTEGER NOT NULL,
  iconUrl TEXT,
  iconSize JSONB,
  glyph TEXT,
  glyphColor TEXT,
  glyphSize TEXT,
  glyphAnchor JSONB,
  shadowScale DECIMAL(3,2),
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by TEXT
);

CREATE TABLE IF NOT EXISTS markers_content_archive (
  id SERIAL PRIMARY KEY,
  original_id INTEGER,
  event_year INTEGER NOT NULL,
  name TEXT,
  logo TEXT,
  website TEXT,
  info TEXT,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by TEXT
);

-- Enable RLS on archive tables (idempotent)
ALTER TABLE markers_core_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE markers_appearance_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE markers_content_archive ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for archive tables (admin only) - idempotent
DROP POLICY IF EXISTS "Admin can view markers archive" ON markers_core_archive;
DROP POLICY IF EXISTS "Admin can insert markers archive" ON markers_core_archive;
CREATE POLICY "Admin can view markers archive" ON markers_core_archive
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can insert markers archive" ON markers_core_archive
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can view markers appearance archive" ON markers_appearance_archive;
DROP POLICY IF EXISTS "Admin can insert markers appearance archive" ON markers_appearance_archive;
CREATE POLICY "Admin can view markers appearance archive" ON markers_appearance_archive
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can insert markers appearance archive" ON markers_appearance_archive
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can view markers content archive" ON markers_content_archive;
DROP POLICY IF EXISTS "Admin can insert markers content archive" ON markers_content_archive;
CREATE POLICY "Admin can view markers content archive" ON markers_content_archive
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can insert markers content archive" ON markers_content_archive
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to archive markers for a specific year (idempotent)
CREATE OR REPLACE FUNCTION archive_markers(event_year_to_archive INTEGER, archived_by_user TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- Archive markers_core
  INSERT INTO markers_core_archive (
    original_id, event_year, lat, lng, rectangle, angle, rectWidth, rectHeight, coreLocked, archived_by
  )
  SELECT
    id, event_year, lat, lng, rectangle, angle, rectWidth, rectHeight, coreLocked, archived_by_user
  FROM markers_core
  WHERE event_year = event_year_to_archive;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Archive markers_appearance
  INSERT INTO markers_appearance_archive (
    original_id, event_year, iconUrl, iconSize, glyph, glyphColor, glyphSize, glyphAnchor, shadowScale, archived_by
  )
  SELECT
    id, event_year, iconUrl, iconSize, glyph, glyphColor, glyphSize, glyphAnchor, shadowScale, archived_by_user
  FROM markers_appearance
  WHERE event_year = event_year_to_archive;

  -- Archive markers_content
  INSERT INTO markers_content_archive (
    original_id, event_year, name, logo, website, info, archived_by
  )
  SELECT
    id, event_year, name, logo, website, info, archived_by_user
  FROM markers_content
  WHERE event_year = event_year_to_archive;

  -- Delete from main tables
  DELETE FROM markers_core WHERE event_year = event_year_to_archive;
  DELETE FROM markers_appearance WHERE event_year = event_year_to_archive;
  DELETE FROM markers_content WHERE event_year = event_year_to_archive;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission (idempotent)
GRANT EXECUTE ON FUNCTION archive_markers(INTEGER, TEXT) TO authenticated;

-- Update RLS policies for marker tables to include event_year filtering
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view markers core" ON markers_core;
DROP POLICY IF EXISTS "Admins can manage markers core" ON markers_core;
DROP POLICY IF EXISTS "Users can view markers appearance" ON markers_appearance;
DROP POLICY IF EXISTS "Admins can manage markers appearance" ON markers_appearance;
DROP POLICY IF EXISTS "Users can view markers content" ON markers_content;
DROP POLICY IF EXISTS "Admins can manage markers content" ON markers_content;

-- Create new RLS policies that work with event_year
CREATE POLICY "Users can view markers core" ON markers_core
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage markers core" ON markers_core
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view markers appearance" ON markers_appearance
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage markers appearance" ON markers_appearance
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view markers content" ON markers_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage markers content" ON markers_content
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');