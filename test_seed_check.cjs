const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { count: subCount } = await s.from('event_subscriptions').select('id', { count: 'exact', head: true });
  const { count: liCount } = await s.from('subscription_line_items').select('id', { count: 'exact', head: true });
  console.log('Subscriptions:', subCount);
  console.log('Line items:', liCount);

  // Check which subscriptions are missing a baseline
  const { data: subs } = await s.from('event_subscriptions').select('id');
  const { data: lis } = await s.from('subscription_line_items').select('subscription_id').eq('source', 'baseline');
  const seeded = new Set((lis || []).map(l => l.subscription_id));
  const missing = (subs || []).filter(sub => !seeded.has(sub.id));
  console.log('Subscriptions missing baseline:', missing.length);
  if (missing.length > 0) console.log('Missing IDs:', missing.map(m => m.id).join(', '));
}
check();
