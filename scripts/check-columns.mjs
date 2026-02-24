
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or SERVICE_ROLE if available, but anon should work for reading public view

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking markers_appearance columns...');
  // Try to insert a dummy row or select specific columns to see if they error?
  // Or just fetch one row and see keys.
  
  const { data, error } = await supabase
    .from('markers_appearance')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  if (data && data.length > 0) {
    const keys = Object.keys(data[0]);
    console.log('Available columns:', keys);
    const hasFontParams = keys.includes('fontWeight') && keys.includes('fontFamily');
    console.log('Has new font parameters:', hasFontParams);
  } else {
    console.log('No data found in markers_appearance to check columns.');
  }
}

checkColumns();
