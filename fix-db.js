import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('organization_profile').select('qr_config, logo').eq('id', 1).single();
  let cfg = data.qr_config;
  cfg.image = '';
  await supabase.from('organization_profile').update({ qr_config: cfg }).eq('id', 1);
  console.log("fixed!");
}
run();
