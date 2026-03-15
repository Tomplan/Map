-- Add a history column to event_subscriptions to track invoice import log entries
-- separately from the human-editable notes field.
ALTER TABLE event_subscriptions
  ADD COLUMN IF NOT EXISTS history TEXT;
