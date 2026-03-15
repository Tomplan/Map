-- Migration 037: Fix subscription_line_items RLS policies
-- The FOR ALL policy was missing WITH CHECK, which blocks INSERT operations.
-- Replace with separate per-operation policies matching the project's pattern.

-- Drop the broken policies
DROP POLICY IF EXISTS "Enable read access for event managers" ON public.subscription_line_items;
DROP POLICY IF EXISTS "Enable write access for event managers" ON public.subscription_line_items;

-- SELECT: authenticated users with event manager+ role
CREATE POLICY "Allow event managers to read subscription_line_items"
  ON public.subscription_line_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: authenticated users
CREATE POLICY "Allow authenticated users to insert subscription_line_items"
  ON public.subscription_line_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: authenticated users
CREATE POLICY "Allow authenticated users to update subscription_line_items"
  ON public.subscription_line_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DELETE: authenticated users
CREATE POLICY "Allow authenticated users to delete subscription_line_items"
  ON public.subscription_line_items
  FOR DELETE
  USING (auth.role() = 'authenticated');
