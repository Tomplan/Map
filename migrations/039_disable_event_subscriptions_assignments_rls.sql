-- Migration 039: Disable RLS on event_subscriptions and assignments
--
-- The app uses the Supabase anon key (role = 'anon').
-- These tables had RLS enabled with policies that block the anon role,
-- causing 401/42501 errors on INSERT, UPDATE, and DELETE operations.
--
-- Symptoms:
--   - "Failed to delete - row not found or blocked by RLS" when unsubscribing
--   - 401 Unauthorized on subscription and assignment mutations
--
-- Fix: disable RLS to allow the anon key full access (matches staged_invoices
-- and subscription_line_items which already have RLS disabled).

ALTER TABLE public.event_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
