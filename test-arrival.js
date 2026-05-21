import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data } = await supabase
    .from('event_subscriptions')
    .select('id, company_id, has_arrived')
    .eq('has_arrived', true);
  console.log('Subscriptions with has_arrived=true:', data);
}
run();
