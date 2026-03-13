const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); async function run() { const { data, error } = await supabase.from('event_subscriptions').select('id').limit(1); console.log(data); } run();
