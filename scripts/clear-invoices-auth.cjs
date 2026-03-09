const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

console.log("🚀 Script started...");

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use Anon key, we will sign in
const adminEmail = process.env.VITE_ADMIN_EMAIL;
const adminPassword = process.env.VITE_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseKey || !adminEmail || !adminPassword) {
  console.error("❌ Error: Missing credentials in .env");
  console.log("Need: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearListAuthenticated() {
  console.log("🔐 Authenticating as admin...");

  try {
    // 1. Sign in
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (authError) {
      console.error("❌ Authentication failed:", authError.message);
      return;
    }

    console.log("✅ Signed in successfully.");

    // 2. Fetch all IDs (now visible because we are authenticated)
    const { data: rows, error: fetchError } = await supabase
      .from('staged_invoices')
      .select('id');

    if (fetchError) {
      console.error("❌ Error fetching invoices:", fetchError.message);
      return;
    }

    if (!rows || rows.length === 0) {
      console.log("✅ Table 'staged_invoices' is already empty.");
      return;
    }

    console.log(`🧹 Found ${rows.length} invoices. Deleting...`);

    // 3. Delete by ID using the current session
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

clearListAuthenticated();
