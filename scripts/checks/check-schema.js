import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.resolve(projectRoot, '.env') });
dotenv.config({ path: path.resolve(projectRoot, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('markers_appearance').select('*').limit(1);
  if (error) {
    console.error('Error fetching markers_appearance:', error);
  } else {
    if (data.length > 0) {
      console.log('Columns in markers_appearance:', Object.keys(data[0]));
    } else {
      console.log('markers_appearance is empty, cannot infer columns.');
    }
  }
}

checkSchema();
