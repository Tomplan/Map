#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

/**
 * Small migration helper to rewrite `logo` fields in `companies` (and optionally other tables)
 * so they point to the CDN-hosted generated variants under the public Logos bucket.
 *
 * Usage (dry-run):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-logos-to-cdn.mjs
 *
 * To actually apply changes add --confirm
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required environment variables');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const confirm = process.argv.includes('--confirm');

function cdnUrl(filename) {
  const supabaseUrl = url.replace(/\/$/, '');
  return `${supabaseUrl}/storage/v1/object/public/Logos/generated/${encodeURIComponent(filename)}`;
}

async function migrateCompanies() {
  console.log('Fetching companies with non-remote logo values...');
  const { data: rows, error } = await supabase
    .from('companies')
    .select('id, logo')
    .or("logo.ilike.%assets/logos/%", "logo.not.ilike.%http%")
    .limit(1000);

  if (error) {
    console.error('Failed to fetch companies:', error.message || error);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No candidate company rows found. Nothing to do.');
    return;
  }

  console.log(`Found ${rows.length} company records to review`);

  const plan = rows.map(r => {
    const logo = r.logo || '';
    const filename = logo.split('/').pop();
    if (!filename) return null;
    const newLogo = cdnUrl(filename);
    return { id: r.id, old: logo, new: newLogo };
  }).filter(Boolean);

  console.table(plan.map(p => ({ id: p.id, old: p.old, new: p.new })));

  if (!confirm) {
    console.log('\nDRY RUN (no changes applied). Rerun with --confirm to apply updates.');
    return;
  }

  console.log('\nApplying updates...');
  for (const item of plan) {
    const { id, new: newUrl } = item;
    const { error: e } = await supabase.from('companies').update({ logo: newUrl }).eq('id', id);
    if (e) console.error('Failed to update company', id, e.message || e);
    else console.log('Updated company', id);
  }
}

(async function main() {
  await migrateCompanies();
  console.log('Done');
})();
