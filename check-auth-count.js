import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const username = process.env.VITE_ADMIN_EMAIL;
const password = process.env.VITE_ADMIN_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const anonRes = await supabase
    .from('staged_invoices')
    .select('*', { count: 'exact', head: true });
  console.log('Anon count:', anonRes.count);

  await supabase.auth.signInWithPassword({ email: username, password: password });
  const authRes = await supabase
    .from('staged_invoices')
    .select('*', { count: 'exact', head: true });
  console.log('Auth count:', authRes.count);
}
check();
