-- Allow anonymous visitors (not logged in) to read the specific, non-sensitive
-- data needed by the public visitor app: exhibitor count, event dates/map
-- settings, and translated company descriptions. Write access stays
-- restricted to managers via the existing policies.

-- subscription_counts is a VIEW; views need their own grant, separate from
-- the underlying table's privileges. It was only granted to 'authenticated'.
GRANT SELECT ON subscription_counts TO anon;

-- The view also has row-level security enabled directly on it with no
-- policy, which hides every row from non-owners regardless of the grant
-- above. Add a public, read-only policy on the view itself.
DROP POLICY IF EXISTS "Public can view subscription counts" ON subscription_counts;
CREATE POLICY "Public can view subscription counts"
ON subscription_counts
FOR SELECT
USING (true);

-- event_map_settings has RLS enabled with a manager-only "FOR ALL" policy.
-- Add a public, read-only policy alongside it (policies are OR'd together).
DROP POLICY IF EXISTS "Public can view event map settings" ON event_map_settings;
CREATE POLICY "Public can view event map settings"
ON event_map_settings
FOR SELECT
USING (true);

-- company_translations has RLS enabled that blocks anonymous reads of
-- translated exhibitor descriptions. Add a public, read-only policy.
DROP POLICY IF EXISTS "Public can view company translations" ON company_translations;
CREATE POLICY "Public can view company translations"
ON company_translations
FOR SELECT
USING (true);
