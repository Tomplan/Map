-- Migration: Add tour tracking to user_preferences table
-- Description: Add columns to track completed and dismissed onboarding tours
-- Date: 2025-12-03

-- Add tour tracking columns to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS tours_completed TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tours_dismissed TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_tour_date TIMESTAMP WITH TIME ZONE;

-- Add comment to document the columns
COMMENT ON COLUMN user_preferences.tours_completed IS 'Array of tour IDs that the user has completed';
COMMENT ON COLUMN user_preferences.tours_dismissed IS 'Array of tour IDs that the user has permanently dismissed';
COMMENT ON COLUMN user_preferences.last_tour_date IS 'Timestamp of when the user last completed or interacted with a tour';

-- The existing row_version trigger will automatically handle version increments
-- when these columns are updated, maintaining optimistic concurrency control
