-- Database Views for Real-Time Count Subscriptions
-- These views provide efficient, real-time count data for the UI

-- View: subscription_counts
-- Purpose: Count of subscribed companies per event year
-- Used by: HomePage (exhibitors), Dashboard (subscriptions), Sidebar (subscriptions badge)
CREATE OR REPLACE VIEW subscription_counts AS
SELECT
  event_year,
  COUNT(*) as count
FROM event_subscriptions
GROUP BY event_year;

-- View: assignment_counts
-- Purpose: Count of booth assignments per event year
-- Used by: Dashboard (assignments), Sidebar (assignments badge)
CREATE OR REPLACE VIEW assignment_counts AS
SELECT
  event_year,
  COUNT(*) as count
FROM assignments
GROUP BY event_year;

-- View: marker_counts
-- Purpose: Count of assignable booth markers (id < 1000) per event year
-- Used by: Dashboard (total assignable booths)
CREATE OR REPLACE VIEW marker_counts AS
SELECT
  event_year,
  COUNT(*) as count
FROM markers_core
WHERE id < 1000
GROUP BY event_year;

-- View: company_counts
-- Purpose: Total count of companies (not year-specific)
-- Used by: Dashboard (companies)
CREATE OR REPLACE VIEW company_counts AS
SELECT
  COUNT(*) as count
FROM companies;

-- Grant permissions for Supabase real-time subscriptions
-- These grants ensure the views can be subscribed to via Supabase's real-time API
GRANT SELECT ON subscription_counts TO authenticated;
GRANT SELECT ON assignment_counts TO authenticated;
GRANT SELECT ON marker_counts TO authenticated;
GRANT SELECT ON company_counts TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW subscription_counts IS 'Real-time count of company subscriptions per event year';
COMMENT ON VIEW assignment_counts IS 'Real-time count of booth assignments per event year';
COMMENT ON VIEW marker_counts IS 'Real-time count of assignable booth markers per event year';
COMMENT ON VIEW company_counts IS 'Real-time total count of companies';