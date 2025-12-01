-- Count Tables with Triggers for Real-Time Updates
-- This approach uses actual tables with triggers for reliable real-time counts

-- Create count tables
CREATE TABLE IF NOT EXISTS subscription_counts (
  event_year INTEGER PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_counts (
  event_year INTEGER PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marker_counts (
  event_year INTEGER PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_counts (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Only one row
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial data
INSERT INTO subscription_counts (event_year, count)
SELECT event_year, COUNT(*) as count
FROM event_subscriptions
GROUP BY event_year
ON CONFLICT (event_year) DO UPDATE SET
  count = EXCLUDED.count;

INSERT INTO assignment_counts (event_year, count)
SELECT event_year, COUNT(*) as count
FROM assignments
GROUP BY event_year
ON CONFLICT (event_year) DO UPDATE SET
  count = EXCLUDED.count;

INSERT INTO marker_counts (event_year, count)
SELECT event_year, COUNT(*) as count
FROM markers_core
WHERE id < 1000
GROUP BY event_year
ON CONFLICT (event_year) DO UPDATE SET
  count = EXCLUDED.count;

INSERT INTO company_counts (id, count)
VALUES (1, (SELECT COUNT(*) FROM companies))
ON CONFLICT (id) DO UPDATE SET
  count = EXCLUDED.count;

-- Function to update subscription counts
CREATE OR REPLACE FUNCTION update_subscription_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_counts (event_year, count, updated_at)
    VALUES (NEW.event_year, 1, NOW())
    ON CONFLICT (event_year) DO UPDATE SET
      count = subscription_counts.count + 1,
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE subscription_counts
    SET count = GREATEST(count - 1, 0), updated_at = NOW()
    WHERE event_year = OLD.event_year;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle year changes
    IF OLD.event_year != NEW.event_year THEN
      -- Decrease old year
      UPDATE subscription_counts
      SET count = GREATEST(count - 1, 0), updated_at = NOW()
      WHERE event_year = OLD.event_year;

      -- Increase new year
      INSERT INTO subscription_counts (event_year, count, updated_at)
      VALUES (NEW.event_year, 1, NOW())
      ON CONFLICT (event_year) DO UPDATE SET
        count = subscription_counts.count + 1,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update assignment counts
CREATE OR REPLACE FUNCTION update_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO assignment_counts (event_year, count, updated_at)
    VALUES (NEW.event_year, 1, NOW())
    ON CONFLICT (event_year) DO UPDATE SET
      count = assignment_counts.count + 1,
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE assignment_counts
    SET count = GREATEST(count - 1, 0), updated_at = NOW()
    WHERE event_year = OLD.event_year;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle year changes
    IF OLD.event_year != NEW.event_year THEN
      -- Decrease old year
      UPDATE assignment_counts
      SET count = GREATEST(count - 1, 0), updated_at = NOW()
      WHERE event_year = OLD.event_year;

      -- Increase new year
      INSERT INTO assignment_counts (event_year, count, updated_at)
      VALUES (NEW.event_year, 1, NOW())
      ON CONFLICT (event_year) DO UPDATE SET
        count = assignment_counts.count + 1,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update marker counts
CREATE OR REPLACE FUNCTION update_marker_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count markers with id < 1000 (assignable booths)
  IF (TG_OP = 'INSERT' AND NEW.id < 1000) OR (TG_OP = 'UPDATE' AND NEW.id < 1000 AND OLD.id >= 1000) THEN
    INSERT INTO marker_counts (event_year, count, updated_at)
    VALUES (NEW.event_year, 1, NOW())
    ON CONFLICT (event_year) DO UPDATE SET
      count = marker_counts.count + 1,
      updated_at = NOW();
  ELSIF (TG_OP = 'DELETE' AND OLD.id < 1000) OR (TG_OP = 'UPDATE' AND OLD.id < 1000 AND NEW.id >= 1000) THEN
    UPDATE marker_counts
    SET count = GREATEST(count - 1, 0), updated_at = NOW()
    WHERE event_year = OLD.event_year;
  ELSIF TG_OP = 'UPDATE' AND OLD.id < 1000 AND NEW.id < 1000 AND OLD.event_year != NEW.event_year THEN
    -- Handle year changes for assignable markers
    UPDATE marker_counts
    SET count = GREATEST(count - 1, 0), updated_at = NOW()
    WHERE event_year = OLD.event_year;

    INSERT INTO marker_counts (event_year, count, updated_at)
    VALUES (NEW.event_year, 1, NOW())
    ON CONFLICT (event_year) DO UPDATE SET
      count = marker_counts.count + 1,
      updated_at = NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update company counts
CREATE OR REPLACE FUNCTION update_company_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE company_counts SET count = count + 1, updated_at = NOW() WHERE id = 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE company_counts SET count = GREATEST(count - 1, 0), updated_at = NOW() WHERE id = 1;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_subscription_count ON event_subscriptions;
CREATE TRIGGER trigger_subscription_count
  AFTER INSERT OR UPDATE OR DELETE ON event_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_count();

DROP TRIGGER IF EXISTS trigger_assignment_count ON assignments;
CREATE TRIGGER trigger_assignment_count
  AFTER INSERT OR UPDATE OR DELETE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_assignment_count();

DROP TRIGGER IF EXISTS trigger_marker_count ON markers_core;
CREATE TRIGGER trigger_marker_count
  AFTER INSERT OR UPDATE OR DELETE ON markers_core
  FOR EACH ROW EXECUTE FUNCTION update_marker_count();

DROP TRIGGER IF EXISTS trigger_company_count ON companies;
CREATE TRIGGER trigger_company_count
  AFTER INSERT OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_company_count();

-- Disable Row Level Security on count tables
-- These are internal tables accessed by triggers, not directly by users
ALTER TABLE subscription_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE marker_counts DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_counts DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON subscription_counts TO authenticated;
GRANT SELECT ON assignment_counts TO authenticated;
GRANT SELECT ON marker_counts TO authenticated;
GRANT SELECT ON company_counts TO authenticated;