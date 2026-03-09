const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("--- DIAGNOSTIC START ---");
console.log(`URL Present: ${!!url}`);
console.log(`Service Key Present: ${!!serviceKey}`);
console.log(`Anon Key Present: ${!!anonKey}`);

async function check() {
  if (!url) { console.log("Aborting: No URL"); return; }
  
  // 1. Try with Service Key
  if (serviceKey) {
     console.log("\nTrying with SERVICE_ROLE_KEY...");
     const sudo = createClient(url, serviceKey, { auth: { persistSession: false }});
     const { count, error } = await sudo.from('staged_invoices').select('*', { count: 'exact', head: true });
     if (error) console.log("Service Key Error:", error.message);
     else console.log(`Service Key sees ${count} rows`);
  } else {
     console.log("\nSKIPPING Service Key check (not found in .env)");
  }

  // 2. Try with Anon Key
  if (anonKey) {
     console.log("\nTrying with ANON_KEY...");
     const anon = createClient(url, anonKey, { auth: { persistSession: false }});
     const { count, error } = await anon.from('staged_invoices').select('*', { count: 'exact', head: true });
     if (error) console.log("Anon Key Error:", error.message);
     else console.log(`Anon Key sees ${count} rows`);
  }
  console.log("--- DIAGNOSTIC END ---");
}

check();
