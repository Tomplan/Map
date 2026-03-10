import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function clear() {
  await supabase.auth.signInWithPassword({
    email: process.env.VITE_ADMIN_EMAIL,
    password: process.env.VITE_ADMIN_PASSWORD,
  });
  const { data: rows } = await supabase.from('staged_invoices').select('id');
  console.log(`Found ${rows.length} rows. Deleting...`);
  await Promise.all(rows.map((r) => supabase.from('staged_invoices').delete().eq('id', r.id)));
  const { count } = await supabase
    .from('staged_invoices')
    .select('*', { count: 'exact', head: true });
  console.log(`Remaining: ${count}`);
}
clear();
