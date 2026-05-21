import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_realtime_tables'); // Or try querying pg_publication

  const { data: pubData, error: pubError } = await supabase.query(`
    select * from pg_publication_tables where pubname = 'supabase_realtime'
  `);
  console.log('Realtime tables (if accessible):', pubData || pubError);
}
run();
