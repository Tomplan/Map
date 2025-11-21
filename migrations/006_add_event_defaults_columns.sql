-- Add Event Defaults columns to Organization_Profile table
-- These columns store default meal counts and notification preferences

-- Add meal count default columns
ALTER TABLE "Organization_Profile" 
ADD COLUMN IF NOT EXISTS "default_breakfast" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "default_lunch" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "default_bbq" INTEGER DEFAULT 0;

-- Add notification settings column (stores JSON)
ALTER TABLE "Organization_Profile"
ADD COLUMN IF NOT EXISTS "notification_settings" JSONB DEFAULT '{"emailNotifications": true, "newSubscriptionNotify": true, "assignmentChangeNotify": true}'::jsonb;

-- Update the existing row with default values
UPDATE "Organization_Profile"
SET 
  "default_breakfast" = COALESCE("default_breakfast", 0),
  "default_lunch" = COALESCE("default_lunch", 0),
  "default_bbq" = COALESCE("default_bbq", 0),
  "notification_settings" = COALESCE("notification_settings", '{"emailNotifications": true, "newSubscriptionNotify": true, "assignmentChangeNotify": true}'::jsonb)
WHERE id = 1;
