import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Inserting default marker appearance entries...');

    // Insert assigned default (blue)
    const { error: error1 } = await supabase
      .from('markers_appearance')
      .upsert({
        id: -1,
        event_year: 0,
        iconUrl: 'glyph-marker-icon-blue.svg',
        appearanceLocked: true,
        shadowScale: 1
      });

    if (error1) {
      console.error('Error inserting assigned default:', error1);
      process.exit(1);
    }

    // Insert unassigned default (gray)
    const { error: error2 } = await supabase
      .from('markers_appearance')
      .upsert({
        id: -2,
        event_year: 0,
        iconUrl: 'glyph-marker-icon-gray.svg',
        appearanceLocked: true,
        shadowScale: 1
      });

    if (error2) {
      console.error('Error inserting unassigned default:', error2);
      process.exit(1);
    }

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runMigration();