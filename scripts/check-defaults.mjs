
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDefaults() {
  console.log('Checking default markers (-1, -2)...');
  
  const { data, error } = await supabase
    .from('markers_appearance')
    .select('*')
    .in('id', [-1, -2])
    .eq('event_year', 0);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log('Default Markers Data:', JSON.stringify(data, null, 2));
}

checkDefaults();
