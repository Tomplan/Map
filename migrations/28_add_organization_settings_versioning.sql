-- Migration 28: Add optimistic concurrency control to organization_settings
-- This adds row_version and updated_by columns for safe multi-admin updates
-- Following the pattern from SUPABASE_MULTIUSER_REALTIME.md

-- Add versioning columns
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS row_version INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create index for performance on version checks
CREATE INDEX IF NOT EXISTS idx_organization_settings_row_version
  ON organization_settings(id, row_version);

-- Update existing trigger to handle row_version (already have updated_at trigger)
-- The existing trigger update_organization_settings_updated_at handles updated_at

-- Backfill updated_by with a system default (NULL is acceptable for org settings)
-- Since it's a singleton table shared by all admins, we don't force a specific user

-- Add comments for documentation
COMMENT ON COLUMN organization_settings.row_version IS 'Version number for optimistic concurrency control. Incremented on each update.';
COMMENT ON COLUMN organization_settings.updated_by IS 'User ID who made the last update. Used for audit trail.';
