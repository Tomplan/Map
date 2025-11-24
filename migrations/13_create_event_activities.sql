-- Migration 007: Create event_activities table for dynamic program management
-- Purpose: Move program schedule from hardcoded data to database
-- Features: Bilingual content, live booth numbers, exhibitor linking, CRUD interface

-- Create event_activities table
CREATE TABLE IF NOT EXISTS event_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INT NOT NULL REFERENCES organization_profile(id) ON DELETE CASCADE,
  
  -- Scheduling
  day TEXT NOT NULL CHECK (day IN ('saturday', 'sunday')),
  start_time TEXT NOT NULL, -- "10:00" format
  end_time TEXT NOT NULL,   -- "17:00" format
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Content (Bilingual)
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_nl TEXT,
  description_en TEXT,
  
  -- Location (Either company reference OR static text)
  location_type TEXT NOT NULL CHECK (location_type IN ('exhibitor', 'venue')),
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL, -- For exhibitor booths
  location_nl TEXT, -- For general venues
  location_en TEXT,
  
  -- Optional Badge
  badge_nl TEXT,
  badge_en TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_location CHECK (
    (location_type = 'exhibitor' AND company_id IS NOT NULL) OR
    (location_type = 'venue' AND location_nl IS NOT NULL AND location_en IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_activities_org_day ON event_activities(organization_id, day, display_order);
CREATE INDEX idx_activities_company ON event_activities(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_activities_active ON event_activities(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE event_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active activities
CREATE POLICY "Public can view active activities"
  ON event_activities FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage their org's activities
CREATE POLICY "Admins can manage activities"
  ON event_activities FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'system_manager', 'content_editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update timestamps
CREATE TRIGGER update_event_activities_timestamp
  BEFORE UPDATE ON event_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_event_activities_updated_at();

-- Comments for documentation
COMMENT ON TABLE event_activities IS 'Event program schedule activities with bilingual content and live booth numbers';
COMMENT ON COLUMN event_activities.location_type IS 'exhibitor: links to company booth, venue: static location text';
COMMENT ON COLUMN event_activities.company_id IS 'Reference to exhibitor company for live booth numbers (only when location_type = exhibitor)';
COMMENT ON COLUMN event_activities.display_order IS 'Sort order within each day (lower numbers appear first)';
