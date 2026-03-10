import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { count } = await supabase.from('staged_invoices').select('*', { count: 'exact', head: true });
  console.log('Staged Invoices count:', count);
}
check();
