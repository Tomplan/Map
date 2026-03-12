import { supabase } from '../supabaseClient';

// ── Count columns tracked by subscription_line_items ──────────────────────────
export const COUNT_COLUMNS = [
  'booth_count',
  'breakfast_sat',
  'lunch_sat',
  'bbq_sat',
  'breakfast_sun',
  'lunch_sun',
  'coins',
];

// ── Add a new line item and recalculate subscription totals ───────────────────
export async function addLineItem(
  subscriptionId,
  {
    source, // 'invoice' | 'manual' | 'edit' | 'baseline'
    sourceRef, // invoice_number for invoice source, null otherwise
    counts = {}, // { booth_count, breakfast_sat, lunch_sat, bbq_sat, breakfast_sun, lunch_sun, coins }
    area,
    notes,
    description, // human-readable label for UI display
  },
) {
  const row = {
    subscription_id: subscriptionId,
    source,
    source_ref: sourceRef ?? null,
    booth_count: counts.booth_count ?? 0,
    breakfast_sat: counts.breakfast_sat ?? 0,
    lunch_sat: counts.lunch_sat ?? 0,
    bbq_sat: counts.bbq_sat ?? 0,
    breakfast_sun: counts.breakfast_sun ?? 0,
    lunch_sun: counts.lunch_sun ?? 0,
    coins: counts.coins ?? 0,
    area: area ?? null,
    notes: notes ?? null,
    description: description ?? null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('subscription_line_items')
    .insert(row)
    .select()
    .single();

  if (error) throw error;

  await recalculateTotals(subscriptionId);
  return data;
}

// ── Deactivate a single line item ─────────────────────────────────────────────
export async function deactivateLineItem(lineItemId) {
  const { data, error } = await supabase
    .from('subscription_line_items')
    .update({ is_active: false, removed_at: new Date().toISOString() })
    .eq('id', lineItemId)
    .select('subscription_id')
    .single();

  if (error) throw error;

  await recalculateTotals(data.subscription_id);
  return data;
}

// ── Deactivate all active line items from a specific invoice ──────────────────
export async function deactivateBySource(subscriptionId, sourceRef) {
  const { error } = await supabase
    .from('subscription_line_items')
    .update({ is_active: false, removed_at: new Date().toISOString() })
    .eq('subscription_id', subscriptionId)
    .eq('source_ref', sourceRef)
    .eq('is_active', true);

  if (error) throw error;

  await recalculateTotals(subscriptionId);
}

// ── Recalculate totals from active line items ─────────────────────────────────
// This is THE source of truth. All mutations call this after changing line items.
export async function recalculateTotals(subscriptionId) {
  // Fetch all active line items
  const { data: items, error: fetchError } = await supabase
    .from('subscription_line_items')
    .select(
      'booth_count, breakfast_sat, lunch_sat, bbq_sat, breakfast_sun, lunch_sun, coins, area, notes',
    )
    .eq('subscription_id', subscriptionId)
    .eq('is_active', true);

  if (fetchError) throw fetchError;

  // Sum count columns — clamp to 0
  const totals = {};
  for (const col of COUNT_COLUMNS) {
    const sum = (items || []).reduce((acc, item) => acc + (item[col] || 0), 0);
    totals[col] = Math.max(0, sum);
  }

  // Derive area and notes from active line items (deduplicated)
  const areas = [...new Set((items || []).map((i) => i.area).filter(Boolean))];
  const notes = [...new Set((items || []).map((i) => i.notes).filter(Boolean))];

  totals.area = areas.join('; ');
  totals.notes = notes.join('\n');

  // Write back to event_subscriptions
  const { error: updateError } = await supabase
    .from('event_subscriptions')
    .update(totals)
    .eq('id', subscriptionId);

  if (updateError) throw updateError;

  return totals;
}

// ── Get all active line items for a subscription ──────────────────────────────
// Used by the removal modal to show structured items instead of history text.
export async function getActiveLineItems(subscriptionId) {
  const { data, error } = await supabase
    .from('subscription_line_items')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ── Get line items by source reference (invoice number) ───────────────────────
export async function getLineItemsBySourceRef(subscriptionId, sourceRef) {
  const { data, error } = await supabase
    .from('subscription_line_items')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('source_ref', sourceRef)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// ── Format a timestamp for history display ────────────────────────────────────
export function formatHistoryTimestamp(date = new Date()) {
  return (
    date.toLocaleDateString('en-GB') +
    ' ' +
    date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  );
}

// ── Append a line to the history text field (display only) ────────────────────
export async function appendHistory(subscriptionId, line) {
  const { data: sub, error: fetchError } = await supabase
    .from('event_subscriptions')
    .select('history')
    .eq('id', subscriptionId)
    .single();

  if (fetchError) throw fetchError;

  const history = (sub.history ? sub.history + '\n' : '') + line;

  const { error: updateError } = await supabase
    .from('event_subscriptions')
    .update({ history })
    .eq('id', subscriptionId);

  if (updateError) throw updateError;
}
