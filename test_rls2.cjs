const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // Test SELECT on event_subscriptions (known working table)
  const { data: sub, error: subErr } = await s.from('event_subscriptions')
    .select('id, lunch_sat, history')
    .limit(1)
    .single();
  console.log('event_subscriptions SELECT:', sub ? 'OK (id=' + sub.id + ')' : 'FAIL', subErr ? subErr.message : '');

  // Test UPDATE on event_subscriptions
  if (sub) {
    const { error: upErr } = await s.from('event_subscriptions')
      .update({ lunch_sat: (sub.lunch_sat || 0) })
      .eq('id', sub.id);
    console.log('event_subscriptions UPDATE:', upErr ? 'FAIL - ' + upErr.message : 'OK');
  }

  // Check RLS policies on subscription_line_items table
  // Use raw SQL to query pg_policies
  const { data: policies, error: polErr } = await s.rpc('exec_sql', {
    query: "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'subscription_line_items'"
  });
  if (polErr) {
    console.log('Cannot query policies via RPC (expected):', polErr.message);
  } else {
    console.log('Policies:', JSON.stringify(policies, null, 2));
  }

  // Check what role we are 
  const { data: roleData, error: roleErr } = await s.rpc('exec_sql', {
    query: "SELECT current_role, auth.role()"
  });
  if (roleErr) {
    console.log('Cannot check role via RPC (expected):', roleErr.message);
  } else {
    console.log('Role:', JSON.stringify(roleData));
  }
}
test();
