#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async function run() {
  const ids = [2,3,4,5,6,7,8,9,10,21];
  try {
    const { data, error } = await supabase.from('companies').select('id,name,logo').in('id', ids);
    if (error) throw error;
    console.table(data || []);
  } catch (err) {
    console.error('Error querying companies:', err.message || err);
    process.exit(1);
  }
})();
