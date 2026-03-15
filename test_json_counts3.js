import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('event_subscriptions').select('history, company_id').not('history', 'is', null).limit(3);
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
check();
