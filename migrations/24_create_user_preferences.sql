-- Migration: Create user_preferences table for storing user-specific settings
-- This table stores preferences that should sync across devices/browsers
-- Device-specific preferences (like sidebar state) remain in localStorage

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event Management Preferences
  default_year INTEGER,

  -- Localization Preferences
  preferred_language TEXT DEFAULT 'nl' CHECK (preferred_language IN ('en', 'nl', 'de')),

  -- Assignment Tab Sort Preferences (moved from localStorage)
  assignments_sort_by TEXT DEFAULT 'alphabetic' CHECK (assignments_sort_by IN ('alphabetic', 'assignment')),
  assignments_sort_direction TEXT DEFAULT 'asc' CHECK (assignments_sort_direction IN ('asc', 'desc')),
  assignments_column_sort TEXT DEFAULT 'markerId',
  assignments_column_sort_direction TEXT DEFAULT 'asc' CHECK (assignments_column_sort_direction IN ('asc', 'desc')),

  -- Dashboard Preferences
  dashboard_visible_cards JSONB DEFAULT '["stats", "recent", "actions"]'::jsonb,

  -- Table Display Preferences
  default_rows_per_page INTEGER DEFAULT 25 CHECK (default_rows_per_page IN (10, 25, 50, 100)),

  -- Notification Preferences
  email_notifications BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own preferences
CREATE POLICY "Users can read own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger: Update updated_at timestamp on row update
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.user_preferences IS 'Stores user-specific preferences that sync across devices';
COMMENT ON COLUMN public.user_preferences.default_year IS 'Default event year selection for filtering';
COMMENT ON COLUMN public.user_preferences.preferred_language IS 'User preferred language (en, nl, de)';
COMMENT ON COLUMN public.user_preferences.assignments_sort_by IS 'Default sort field for assignments tab (alphabetic or assignment)';
COMMENT ON COLUMN public.user_preferences.dashboard_visible_cards IS 'JSONB array of visible dashboard card IDs';
