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

async function fetchRowsForTable(tableName, select = 'id, logo', whereOr = 'logo.ilike.%assets/logos/%,logo.not.ilike.%http%,logo.ilike.%/Logos/companies/%,logo.ilike.%/Logos/organization/%', limit = 1000) {
  console.log(`Fetching ${tableName} rows with non-remote logo values...`);
  const { data: rows, error } = await supabase
    .from(tableName)
    .select(select)
    .or(whereOr)
    .limit(limit);

  if (error) {
    console.error(`Failed to fetch rows from ${tableName}:`, error.message || error);
    process.exit(1);
  }

  return rows || [];
}

async function migrateCompanies() {
  const rows = await fetchRowsForTable('companies');

  if (!rows || rows.length === 0) {
    console.log('No candidate company rows found. Nothing to do.');
    return;
  }

  // Filter out rows which already point to the 'generated' CDN path — nothing to do for those
  const candidates = rows.filter(r => {
    const logo = (r.logo || '').toString();
    if (!logo) return false;
    if (logo.includes('/Logos/generated/')) return false;
    return true;
  });

  if (candidates.length === 0) {
    console.log('No candidate company rows found (all already point to generated CDN). Nothing to do.');
    return;
  }

  console.log(`Found ${candidates.length} company records to review`);

  const plan = candidates.map(r => {
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

async function migrateMarkers() {
  // markers_content holds the marker's content including logo
  const rows = await fetchRowsForTable('markers_content', 'id, logo, event_year', 'logo.ilike.%assets/logos/%,logo.not.ilike.%http%', 1000);

  if (!rows || rows.length === 0) {
    console.log('No candidate marker rows found. Nothing to do.');
    return;
  }

  const candidates = rows.filter(r => {
    const logo = (r.logo || '').toString();
    if (!logo) return false;
    if (logo.includes('/Logos/generated/')) return false;
    return true;
  });

  if (candidates.length === 0) {
    console.log('No candidate marker rows found (all already point to generated CDN). Nothing to do.');
    return;
  }

  console.log(`Found ${candidates.length} marker records to review`);

  const plan = candidates.map(r => {
    const logo = r.logo || '';
    const filename = logo.split('/').pop();
    if (!filename) return null;
    const newLogo = cdnUrl(filename);
    return { id: r.id, event_year: r.event_year, old: logo, new: newLogo };
  }).filter(Boolean);

  console.table(plan.map(p => ({ id: p.id, event_year: p.event_year, old: p.old, new: p.new })));

  if (!confirm) {
    console.log('\nDRY RUN (no changes applied). Rerun with --confirm to apply updates.');
    return;
  }

  console.log('\nApplying marker updates...');
  for (const item of plan) {
    const { id, new: newUrl } = item;
    const { error: e } = await supabase.from('markers_content').update({ logo: newUrl }).eq('id', id);
    if (e) console.error('Failed to update marker', id, e.message || e);
    else console.log('Updated marker', id);
  }
}

async function migrateOrganizationProfile() {
  // single-row branding table (id=1) - handle possible non-remote logo values
  const rows = await fetchRowsForTable('organization_profile', 'id, logo', 'logo.not.ilike.%http%,logo.ilike.%assets/logos/%', 10);

  if (!rows || rows.length === 0) {
    console.log('No candidate organization_profile rows found. Nothing to do.');
    return;
  }

  const candidates = rows.filter(r => {
    const logo = (r.logo || '').toString();
    if (!logo) return false;
    if (logo.includes('/Logos/generated/')) return false;
    return true;
  });

  if (candidates.length === 0) {
    console.log('No candidate organization_profile rows found (all already point to generated CDN). Nothing to do.');
    return;
  }

  console.log(`Found ${candidates.length} organization_profile rows to review`);

  const plan = candidates.map(r => {
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

  console.log('\nApplying organization_profile updates...');
  for (const item of plan) {
    const { id, new: newUrl } = item;
    const { error: e } = await supabase.from('organization_profile').update({ logo: newUrl }).eq('id', id);
    if (e) console.error('Failed to update organization_profile', id, e.message || e);
    else console.log('Updated organization_profile', id);
  }
}

(async function main() {
  await migrateCompanies();
  await migrateMarkers();
  await migrateOrganizationProfile();
  console.log('Done');
})();
