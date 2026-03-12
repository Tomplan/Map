-- Migration 035: Create subscription_line_items table
-- Replaces fragile history-text-parsing with structured line item records.
-- Every subscription change (invoice approval, manual add, edit) becomes a row.
-- event_subscriptions count columns become denormalized sums of active line items.

CREATE TABLE IF NOT EXISTS public.subscription_line_items (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES public.event_subscriptions(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('invoice', 'manual', 'edit', 'baseline')),
  source_ref TEXT,              -- invoice_number for invoice source, null otherwise
  booth_count INTEGER DEFAULT 0,
  breakfast_sat INTEGER DEFAULT 0,
  lunch_sat INTEGER DEFAULT 0,
  bbq_sat INTEGER DEFAULT 0,
  breakfast_sun INTEGER DEFAULT 0,
  lunch_sun INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  area TEXT,
  notes TEXT,
  description TEXT,             -- Human-readable label for UI display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE
);

-- Index for the most common query: active items for a subscription
CREATE INDEX idx_line_items_sub_active
  ON public.subscription_line_items (subscription_id, is_active);

-- Index for finding line items by invoice number (undo flow)
CREATE INDEX idx_line_items_source_ref
  ON public.subscription_line_items (source_ref)
  WHERE source_ref IS NOT NULL;

-- Enable RLS
ALTER TABLE public.subscription_line_items ENABLE ROW LEVEL SECURITY;

-- Read access for event managers and above
CREATE POLICY "Enable read access for event managers"
  ON public.subscription_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );

-- Write access for event managers and above
CREATE POLICY "Enable write access for event managers"
  ON public.subscription_line_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'system_manager', 'event_manager')
    )
  );

-- Enable real-time (Supabase)
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_line_items;
