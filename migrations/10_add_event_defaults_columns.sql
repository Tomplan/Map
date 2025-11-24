-- Add Event Defaults columns to Organization_Profile table
-- These columns store default meal counts and notification preferences

-- Add meal count default columns - Saturday
ALTER TABLE "Organization_Profile" 
ADD COLUMN IF NOT EXISTS "default_breakfast_sat" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "default_lunch_sat" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "default_bbq_sat" INTEGER DEFAULT 0;

-- Add meal count default columns - Sunday
ALTER TABLE "Organization_Profile"
ADD COLUMN IF NOT EXISTS "default_breakfast_sun" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "default_lunch_sun" INTEGER DEFAULT 0;

-- Add notification settings column (stores JSON)
ALTER TABLE "Organization_Profile"
ADD COLUMN IF NOT EXISTS "notification_settings" JSONB DEFAULT '{"emailNotifications": true, "newSubscriptionNotify": true, "assignmentChangeNotify": true}'::jsonb;

-- Update the existing row with default values
UPDATE "Organization_Profile"
SET 
  "default_breakfast_sat" = COALESCE("default_breakfast_sat", 0),
  "default_lunch_sat" = COALESCE("default_lunch_sat", 0),
  "default_bbq_sat" = COALESCE("default_bbq_sat", 0),
  "default_breakfast_sun" = COALESCE("default_breakfast_sun", 0),
  "default_lunch_sun" = COALESCE("default_lunch_sun", 0),
  "notification_settings" = COALESCE("notification_settings", '{"emailNotifications": true, "newSubscriptionNotify": true, "assignmentChangeNotify": true}'::jsonb)
WHERE id = 1;
