-- Migration 038: Fix subscription_line_items RLS — disable to match parent table
--
-- Root cause: event_subscriptions has NO RLS enabled, so the anon key
-- (role = 'anon') can freely read/write.  But subscription_line_items had
-- RLS enabled with policies requiring auth.role() = 'authenticated', which
-- blocks the anon key on every operation (SELECT, INSERT, UPDATE, DELETE).
--
-- Fix: drop all policies and disable RLS so the table behaves identically
-- to its parent table event_subscriptions.

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for event managers" ON public.subscription_line_items;
DROP POLICY IF EXISTS "Enable write access for event managers" ON public.subscription_line_items;
DROP POLICY IF EXISTS "Allow event managers to read subscription_line_items" ON public.subscription_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert subscription_line_items" ON public.subscription_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to update subscription_line_items" ON public.subscription_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete subscription_line_items" ON public.subscription_line_items;

-- Disable RLS entirely (matches event_subscriptions)
ALTER TABLE public.subscription_line_items DISABLE ROW LEVEL SECURITY;
