const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // First get a real subscription id
  const { data: subs } = await s.from('event_subscriptions').select('id').limit(1);
  if (!subs || subs.length === 0) { console.log('No subscriptions found'); return; }
  const subId = subs[0].id;
  console.log('Test subscription ID:', subId);

  // Try inserting a test line item
  const { data, error } = await s.from('subscription_line_items')
    .insert({
      subscription_id: subId,
      source: 'edit',
      lunch_sat: 1,
      description: 'TEST - delete me',
      is_active: true,
    })
    .select()
    .single();

  console.log('INSERT result:', data ? 'SUCCESS' : 'FAILED');
  console.log('Error:', error ? JSON.stringify(error) : 'none');

  // Also check if any line items exist at all
  const { data: existing, error: selErr } = await s.from('subscription_line_items').select('id, source, description').limit(5);
  console.log('Existing line items:', existing ? existing.length : 0, 'rows');
  if (selErr) console.log('SELECT error:', JSON.stringify(selErr));
  if (existing) console.log('Sample:', JSON.stringify(existing.slice(0,3)));

  // Clean up test row if successful
  if (data) {
    await s.from('subscription_line_items').delete().eq('id', data.id);
    console.log('Cleaned up test row');
  }
}
test();
