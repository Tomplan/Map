require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_realtime_tables');
  if (error) console.error('Could not run rpc, will try a direct SQL if possible', error);
  else console.log(data);
}
run();
