-- Migration 27: Add optimistic concurrency control to user_preferences
-- This adds row_version, updated_at, and updated_by columns for safe multi-user updates
-- Following the pattern from SUPABASE_MULTIUSER_REALTIME.md

-- Add versioning columns
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS row_version INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create index for performance on version checks
CREATE INDEX IF NOT EXISTS idx_user_preferences_row_version
  ON user_preferences(user_id, row_version);

-- Create trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on UPDATE
DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Backfill updated_by with user_id for existing rows
UPDATE user_preferences
SET updated_by = user_id
WHERE updated_by IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.row_version IS 'Version number for optimistic concurrency control. Incremented on each update.';
COMMENT ON COLUMN user_preferences.updated_at IS 'Timestamp of last update. Auto-maintained by trigger.';
COMMENT ON COLUMN user_preferences.updated_by IS 'User ID who made the last update. Used for audit trail.';
