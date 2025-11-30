-- Create event_map_settings table for year-specific map configurations
-- This allows different map settings (center, zoom levels) per event year

CREATE TABLE event_map_settings (
  id SERIAL PRIMARY KEY,
  event_year INTEGER NOT NULL UNIQUE,
  map_center_lat DECIMAL(10,8),
  map_center_lng DECIMAL(11,8),
  map_default_zoom INTEGER,
  map_min_zoom INTEGER,
  map_max_zoom INTEGER,
  map_search_zoom INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE event_map_settings ENABLE ROW LEVEL SECURITY;

-- Allow system managers and super admins to manage map settings
CREATE POLICY "System managers and super admins can manage event map settings"
ON event_map_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('system_manager', 'super_admin')
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_event_map_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_map_settings_updated_at
  BEFORE UPDATE ON event_map_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_map_settings_updated_at();

-- Add helpful comment
COMMENT ON TABLE event_map_settings IS 'Year-specific map configuration settings. Falls back to organization_settings for global defaults.';