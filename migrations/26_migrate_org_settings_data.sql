-- Migration 26: Migrate existing settings from organization_profile to organization_settings
-- This migration safely copies setting data while preserving organization identity info

-- Copy meal defaults, branding, and notification settings from organization_profile
UPDATE public.organization_settings
SET
  -- Meal Defaults (from migration 10)
  default_breakfast_sat = COALESCE((SELECT default_breakfast_sat FROM public.organization_profile WHERE id = 1), 0),
  default_lunch_sat = COALESCE((SELECT default_lunch_sat FROM public.organization_profile WHERE id = 1), 0),
  default_bbq_sat = COALESCE((SELECT default_bbq_sat FROM public.organization_profile WHERE id = 1), 0),
  default_breakfast_sun = COALESCE((SELECT default_breakfast_sun FROM public.organization_profile WHERE id = 1), 0),
  default_lunch_sun = COALESCE((SELECT default_lunch_sun FROM public.organization_profile WHERE id = 1), 0),

  -- Notification Settings (from migration 10)
  notification_settings = COALESCE(
    (SELECT notification_settings FROM public.organization_profile WHERE id = 1),
    '{
      "emailNotifications": true,
      "newSubscriptionNotify": true,
      "assignmentChangeNotify": true
    }'::jsonb
  ),

  -- Branding (from migration 11)
  theme_color = COALESCE((SELECT theme_color FROM public.organization_profile WHERE id = 1), '#3b82f6'),
  font_family = COALESCE((SELECT font_family FROM public.organization_profile WHERE id = 1), 'Arvo, serif'),

  -- Update timestamp
  updated_at = NOW()
WHERE id = 1;

-- Note: We are NOT dropping columns from organization_profile yet
-- This allows for a rollback period and gradual migration of components
-- A future migration (27) can drop these columns after all components are updated

-- Log the migration
DO $$
DECLARE
  v_migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_migrated_count
  FROM public.organization_settings
  WHERE id = 1;

  IF v_migrated_count = 1 THEN
    RAISE NOTICE 'Migration 26: Successfully migrated settings from organization_profile to organization_settings';
  ELSE
    RAISE WARNING 'Migration 26: organization_settings table is empty or has multiple rows';
  END IF;
END $$;

-- Add comments to mark deprecated columns (will be dropped in migration 27)
COMMENT ON COLUMN public.organization_profile.default_breakfast_sat IS '[DEPRECATED - use organization_settings] Default breakfast count for Saturday';
COMMENT ON COLUMN public.organization_profile.default_lunch_sat IS '[DEPRECATED - use organization_settings] Default lunch count for Saturday';
COMMENT ON COLUMN public.organization_profile.default_bbq_sat IS '[DEPRECATED - use organization_settings] Default BBQ count for Saturday';
COMMENT ON COLUMN public.organization_profile.default_breakfast_sun IS '[DEPRECATED - use organization_settings] Default breakfast count for Sunday';
COMMENT ON COLUMN public.organization_profile.default_lunch_sun IS '[DEPRECATED - use organization_settings] Default lunch count for Sunday';
COMMENT ON COLUMN public.organization_profile.notification_settings IS '[DEPRECATED - use organization_settings] Notification preferences';
COMMENT ON COLUMN public.organization_profile.theme_color IS '[DEPRECATED - use organization_settings] Organization theme color';
COMMENT ON COLUMN public.organization_profile.font_family IS '[DEPRECATED - use organization_settings] Organization font family';
