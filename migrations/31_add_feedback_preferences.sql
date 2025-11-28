-- Migration 31: Add feedback filter preferences to user_preferences
-- Adds columns for storing user's feedback filter settings persistently

-- Add feedback preference columns
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS feedback_active_tab TEXT DEFAULT 'all' CHECK (feedback_active_tab IN ('all', 'my', 'submit')),
  ADD COLUMN IF NOT EXISTS feedback_filter_types JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS feedback_filter_statuses JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have the new default values
UPDATE user_preferences
SET
  feedback_active_tab = 'all',
  feedback_filter_types = '[]'::jsonb,
  feedback_filter_statuses = '[]'::jsonb,
  row_version = row_version + 1,
  updated_by = user_id
WHERE feedback_active_tab IS NULL;