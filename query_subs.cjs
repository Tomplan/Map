require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('event_subscriptions').select('*').eq('event_year', 2026);
  console.log("Subscriptions 2026:", data);
}
run();
