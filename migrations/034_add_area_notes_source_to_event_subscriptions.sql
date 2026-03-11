-- Originally added area_source / notes_source columns; approach replaced by
-- embedding area/notes markers directly in the subscription history field.
-- Drop the columns if they were added by a previous version of this migration.
ALTER TABLE event_subscriptions
  DROP COLUMN IF EXISTS area_source,
  DROP COLUMN IF EXISTS notes_source;
