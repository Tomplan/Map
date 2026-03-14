require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const {data: counts} = await supabase.from('subscription_counts').select('*');
  console.log('counts (service role):', counts);
}
run();
