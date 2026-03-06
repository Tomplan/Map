import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.VITE_ADMIN_EMAIL,
    password: process.env.VITE_ADMIN_PASSWORD
  });
  if (authError) { console.error("Auth error:", authError); return; }
  
  const { data, error } = await supabase.from('organization_profile').select('qr_config, logo').eq('id', 1).single();
  let cfg = data.qr_config;
  cfg.image = '';
  const { error: updateError } = await supabase.from('organization_profile').update({ qr_config: cfg }).eq('id', 1);
  if (updateError) { console.error("Update error:", updateError); } else { console.log("Really fixed!"); }
}
run();
