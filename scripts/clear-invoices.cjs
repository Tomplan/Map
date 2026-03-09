const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '../.env');
const localEnvPath = path.resolve(__dirname, '../.env.local');

// Try loading .env
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}
// OVERRIDE with .env.local if it exists (standard Vite behavior)
if (fs.existsSync(localEnvPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(localEnvPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Priority: Service Role Key -> Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing VITE_SUPABASE_URL or SERVICE_ROLE_KEY/ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function clearList() {
  console.log("🧹 specific-clearing 'staged_invoices' table...");

  try {
    // 2. Fetch all IDs first (Robust method to handle UUID vs Int)
    const { data: rows, error: fetchError } = await supabase
      .from('staged_invoices')
      .select('id');

    if (fetchError) {
      console.error("❌ Error fetching invoices:", fetchError.message);
      return;
    }

    if (!rows || rows.length === 0) {
      console.log("✅ Table is already empty.");
      return;
    }

    console.log(`found ${rows.length} invoices. Deleting...`);

    // 3. Delete by ID list
    const ids = rows.map(r => r.id);
    const { error: deleteError } = await supabase
      .from('staged_invoices')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error("❌ Error deleting rows:", deleteError.message);
    } else {
      console.log(`✅ Successfully deleted ${ids.length} invoices.`);
    }

  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

clearList();
