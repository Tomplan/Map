
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('markers_core').select('*').limit(1);
  if (error) {
    console.error('Error fetching markers_core:', error);
  } else {
    if (data.length > 0) {
      console.log('Columns in markers_core:', Object.keys(data[0]));
    } else {
      console.log('markers_core is empty, trying to insert dummy to see columns (not really)');
      // If empty, we can't see keys. But we can retry with a known likely column to see if it works?
      // No, let's just try to select `rectWidth` explicitly.
      const { error: colError } = await supabase.from('markers_core').select('rectWidth').limit(1);
      if (colError) {
          console.log('rectWidth column query error:', colError.message);
      } else {
          console.log('rectWidth column exists');
      }
    }
  }
}

checkSchema();
