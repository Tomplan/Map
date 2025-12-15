import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY)');
  process.exit(2);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const year = process.argv[2] ? parseInt(process.argv[2], 10) : new Date().getFullYear();

(async () => {
  try {
    console.log(`Checking markers for year: ${year}`);
    const { data, error } = await supabase.from('markers_core').select('id, event_year').eq('event_year', year).limit(500);
    if (error) {
      console.error('Supabase error:', error);
      process.exit(2);
    }
    console.log(`Found ${data.length} markers for year ${year}`);
    if (data.length > 0) console.log('Sample ids:', data.slice(0, 10).map((r) => r.id));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
