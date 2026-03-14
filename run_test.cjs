require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const cId = 52;
  const year = 2030;
  await supabase.from('event_subscriptions').insert({ company_id: cId, event_year: year, history: 'Test' });
  const { data: cr } = await supabase.from('subscription_counts').select('*').eq('event_year', year);
  console.log("Count after insert:", cr);
  await supabase.from('event_subscriptions').delete().match({ company_id: cId, event_year: year });
  const { data: cr2 } = await supabase.from('subscription_counts').select('*').eq('event_year', year);
  console.log("Count after delete:", cr2);
}
run();
