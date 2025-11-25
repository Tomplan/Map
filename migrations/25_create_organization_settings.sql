-- Migration 25: Create organization_settings table
-- Separates organization-wide configuration from organization identity
-- This table stores system-wide settings that apply to all managers

-- Create organization_settings table (singleton)
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- Event Meal Defaults
  -- Default meal counts for new event subscriptions
  default_breakfast_sat INTEGER DEFAULT 0,
  default_lunch_sat INTEGER DEFAULT 0,
  default_bbq_sat INTEGER DEFAULT 0,
  default_breakfast_sun INTEGER DEFAULT 0,
  default_lunch_sun INTEGER DEFAULT 0,

  -- Visual Branding
  -- Organization-wide theme customization
  theme_color TEXT DEFAULT '#3b82f6',  -- Tailwind blue-500
  font_family TEXT DEFAULT 'Arvo, serif',

  -- Map Configuration
  -- Default map view settings (previously hard-coded in mapConfig.js)
  map_center_lat DOUBLE PRECISION DEFAULT 51.898095,
  map_center_lng DOUBLE PRECISION DEFAULT 5.772961,
  map_default_zoom INTEGER DEFAULT 17,
  map_min_zoom INTEGER DEFAULT 14,
  map_max_zoom INTEGER DEFAULT 22,
  map_search_zoom INTEGER DEFAULT 21,
  map_enabled_layers JSONB DEFAULT '["carto", "esri"]'::jsonb,

  -- Public Visitor Settings
  -- Year shown to public (non-authenticated) visitors
  -- NULL means "use current calendar year"
  public_default_year INTEGER,

  -- Notification Settings
  -- Organization-wide notification preferences
  notification_settings JSONB DEFAULT '{
    "emailNotifications": true,
    "newSubscriptionNotify": true,
    "assignmentChangeNotify": true
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one row exists (singleton pattern)
  CONSTRAINT singleton_organization_settings CHECK (id = 1)
);

-- Insert default row
INSERT INTO public.organization_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster lookups (though it's a singleton)
CREATE INDEX IF NOT EXISTS idx_organization_settings_id
ON public.organization_settings(id);

-- Enable Row Level Security
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read organization settings (including public visitors)
CREATE POLICY "Public can read organization settings"
ON public.organization_settings
FOR SELECT
USING (true);

-- RLS Policy: Only super_admin and system_manager can update settings
CREATE POLICY "Admins can update organization settings"
ON public.organization_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_manager')
  )
);

-- Trigger: Update updated_at timestamp on row update
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.organization_settings IS 'Organization-wide system settings (singleton table)';
COMMENT ON COLUMN public.organization_settings.default_breakfast_sat IS 'Default breakfast count for Saturday subscriptions';
COMMENT ON COLUMN public.organization_settings.default_lunch_sat IS 'Default lunch count for Saturday subscriptions';
COMMENT ON COLUMN public.organization_settings.default_bbq_sat IS 'Default BBQ count for Saturday subscriptions';
COMMENT ON COLUMN public.organization_settings.default_breakfast_sun IS 'Default breakfast count for Sunday subscriptions';
COMMENT ON COLUMN public.organization_settings.default_lunch_sun IS 'Default lunch count for Sunday subscriptions';
COMMENT ON COLUMN public.organization_settings.theme_color IS 'Organization theme color (hex)';
COMMENT ON COLUMN public.organization_settings.font_family IS 'Organization font family for branding';
COMMENT ON COLUMN public.organization_settings.map_center_lat IS 'Default map center latitude';
COMMENT ON COLUMN public.organization_settings.map_center_lng IS 'Default map center longitude';
COMMENT ON COLUMN public.organization_settings.map_default_zoom IS 'Default map zoom level';
COMMENT ON COLUMN public.organization_settings.map_enabled_layers IS 'Array of enabled map tile layers';
COMMENT ON COLUMN public.organization_settings.public_default_year IS 'Event year shown to public visitors (NULL = current year)';
COMMENT ON COLUMN public.organization_settings.notification_settings IS 'Organization-wide notification preferences (JSONB)';
