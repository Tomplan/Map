-- Simple phone normalization for companies and event_subscriptions
-- Removes spaces, parentheses, dashes, dots
-- Converts leading 00 to +
-- Converts empty strings to NULL

BEGIN;

-- Update companies table - simple direct update
UPDATE companies
SET phone = CASE
  -- Convert empty or just '+' to NULL
  WHEN NULLIF(TRIM(phone), '') IS NULL THEN NULL
  WHEN NULLIF(TRIM(phone), '+') IS NULL THEN NULL
  -- Otherwise normalize: trim, convert 00 to +, remove formatting chars, collapse multiple +
  ELSE regexp_replace(
    regexp_replace(
      regexp_replace(TRIM(phone), '^00', '+'),
      '[^0-9+]+', '', 'g'
    ),
    '^\++', '+'
  )
END
WHERE phone IS NOT NULL
  AND phone != '';

-- Update event_subscriptions table - simple direct update
UPDATE event_subscriptions
SET phone = CASE
  -- Convert empty or just '+' to NULL
  WHEN NULLIF(TRIM(phone), '') IS NULL THEN NULL
  WHEN NULLIF(TRIM(phone), '+') IS NULL THEN NULL
  -- Otherwise normalize: trim, convert 00 to +, remove formatting chars, collapse multiple +
  ELSE regexp_replace(
    regexp_replace(
      regexp_replace(TRIM(phone), '^00', '+'),
      '[^0-9+]+', '', 'g'
    ),
    '^\++', '+'
  )
END
WHERE phone IS NOT NULL
  AND phone != '';

COMMIT;
