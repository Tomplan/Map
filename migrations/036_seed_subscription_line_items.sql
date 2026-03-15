-- Migration 036: Seed subscription_line_items with baseline records for existing subscriptions
-- This creates a single 'baseline' line item per existing subscription, capturing
-- the current count values so that recalculateTotals() produces identical results.
-- Non-destructive: no existing data is modified.

-- Only insert for subscriptions that don't already have line items (idempotent)
INSERT INTO subscription_line_items (
  subscription_id,
  source,
  source_ref,
  booth_count,
  breakfast_sat,
  lunch_sat,
  bbq_sat,
  breakfast_sun,
  lunch_sun,
  coins,
  area,
  notes,
  description,
  is_active,
  created_at
)
SELECT
  es.id,
  'baseline',
  NULL,
  COALESCE(es.booth_count, 0),
  COALESCE(es.breakfast_sat, 0),
  COALESCE(es.lunch_sat, 0),
  COALESCE(es.bbq_sat, 0),
  COALESCE(es.breakfast_sun, 0),
  COALESCE(es.lunch_sun, 0),
  COALESCE(es.coins, 0),
  es.area,
  es.notes,
  'Baseline from existing subscription (migration 036)',
  true,
  NOW()
FROM event_subscriptions es
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_line_items sli
  WHERE sli.subscription_id = es.id
);
