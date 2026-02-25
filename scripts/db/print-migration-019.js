import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert current module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (relative to script location, assuming .env in root)
const rootDir = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootDir, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use SERVICE_ROLE_KEY if available for migrations, otherwise default to ANON_KEY (but ANON might fail for DDL)
// Ideally migrations run with elevated privileges.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials (VITE_SUPABASE_URL or appropriate KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration: 019_create_map_snapshots.sql');

    const sqlPath = path.join(rootDir, 'migrations', '019_create_map_snapshots.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by semicolon if we were using pg directly, but Supabase RPC usually executes functions.
    // However, Supabase JS client doesn't support raw SQL execution directly on public schemas usually unless via RPC.
    // BUT since we don't have a pg client setup easily here, let's try to see if there is an existing pattern.
    // The previous run-migration.js used direct table interaction (upsert).
    // DDL (create table) requires SQL execution.
    // If we only have the supabase-js client and no raw SQL access via RPC, we are stuck unless we use pg-node or similar, or prompt user to run in SQL Editor.

    // Let's check package.json for 'pg' or similar.
    // The package.json showed: "@supabase/supabase-js": "^2.97.0",
    // No 'pg' driver.

    // However, if we can't run raw SQL from node, we should instruct the user.
    // OR create a temporary RPC function to exec SQL if one exists? No.
    // Wait, the previous run-migration.js was just inserting data.

    // This is a DDL migration. It must be run in the Supabase SQL Editor.
    // I will instruct the user to run it.

    console.log('--- MIGRATION SQL ---');
    console.log(sql);
    console.log('---------------------');
    console.log('Please copy the SQL above and run it in your Supabase SQL Editor.');
  } catch (err) {
    console.error('Migration script error:', err);
    process.exit(1);
  }
}

runMigration();
