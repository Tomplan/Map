import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const adminEmail = process.env.VITE_ADMIN_EMAIL;
const adminPassword = process.env.VITE_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
    console.error("❌ CRITICAL ERROR: VITE_ADMIN_EMAIL or VITE_ADMIN_PASSWORD missing from .env.local!");
    console.error("Cannot clear invoices because RLS requires an authenticated admin.");
    process.exit(1);
}

console.log("Using URL:", supabaseUrl); // Debug to make sure it's the right one

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearInvoices() {
    console.log(`🔐 Logging in as Admin: ${adminEmail}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
    });

    if (authError) {
        console.error("❌ Authentication Failed. Check your admin credentials.", authError.message);
        return;
    }

    console.log("✅ Logged in successfully. Fetching staged invoices...");

    // We must fetch and loop to bypass bulk-delete RLS protections
    const { data: rows, error: fetchError } = await supabase.from('staged_invoices').select('id');
    
    if (fetchError) {
        console.error("❌ Failed to fetch invoices:", fetchError.message);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log("✅ Database is already entirely empty! (0 rows found)");
        return;
    }

    console.log(`🗑️ Found ${rows.length} protected rows. Commencing hard-delete...`);

    // Delete rows explicitly
    const deletePromises = rows.map(r => supabase.from('staged_invoices').delete().eq('id', r.id));
    await Promise.all(deletePromises);

    // Final verification check
    const { count } = await supabase.from('staged_invoices').select('*', { count: 'exact', head: true });
    
    if (count === 0) {
        console.log(`✅ SUCCESS: List completely cleared! Verification passed: 0 rows remaining.`);
    } else {
        console.error(`❌ WARNING: Deletion incomplete. ${count} rows are still stuck in the database.`);
    }
}
clearInvoices();
