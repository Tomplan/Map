#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function listGeneratedObjects() {
  const res = await supabase.storage.from('Logos').list('generated', { limit: 2000 });
  if (res.error) throw res.error;
  return res.data.map(o => o.name);
}

async function getPlannedFilenames() {
  // Query companies and markers_content for non-remote logo values (not already /Logos/generated/)
  const companyFetch = await supabase
    .from('companies')
    .select('logo')
    .or("logo.ilike.%assets/logos/%,logo.not.ilike.%http%,logo.ilike.%/Logos/companies/%,logo.ilike.%/Logos/organization/%")
    .limit(2000);

  if (companyFetch.error) throw companyFetch.error;

  const markerFetch = await supabase
    .from('markers_content')
    .select('logo')
    .or("logo.ilike.%assets/logos/%,logo.not.ilike.%http%,logo.ilike.%/Logos/companies/%,logo.ilike.%/Logos/organization/%")
    .limit(2000);

  if (markerFetch.error) throw markerFetch.error;

  const items = [];
  for (const r of (companyFetch.data || [])) {
    const logo = r.logo || '';
    if (!logo) continue;
    if (logo.includes('/Logos/generated/')) continue;
    const filename = logo.split('/').pop();
    if (filename) items.push(filename);
  }
  for (const r of (markerFetch.data || [])) {
    const logo = r.logo || '';
    if (!logo) continue;
    if (logo.includes('/Logos/generated/')) continue;
    const filename = logo.split('/').pop();
    if (filename) items.push(filename);
  }

  // dedupe
  return Array.from(new Set(items));
}

(async function main() {
  try {
    console.log('Listing objects in Logos/generated...');
    const objects = await listGeneratedObjects();
    console.log(`Found ${objects.length} objects in Logos/generated`);

    console.log('Collecting planned filenames from DB rows (companies + markers_content)...');
    const planned = await getPlannedFilenames();
    console.log(`Planned unique filenames to map -> ${planned.length}`);

    const missing = [];
    for (const fn of planned) {
      // check exact name first
      if (objects.includes(fn)) continue;
      // check encoded
      const enc = encodeURIComponent(fn);
      if (objects.includes(enc)) continue;
      // lowercase match (some files might be case-insensitive)
      const lower = objects.find(o => o.toLowerCase() === fn.toLowerCase());
      if (lower) continue;

      // check for generated variants based on basename (e.g. name-128.webp)
      const basename = fn.replace(/\.[^.]+$/, '');
      const sizes = [64, 128, 256, 512];
      let foundVariant = false;
      for (const s of sizes) {
        const w1 = `${basename}-${s}.webp`;
        const a1 = `${basename}-${s}.avif`;
        if (objects.includes(w1) || objects.includes(a1)) {
          foundVariant = true;
          break;
        }
        // also check URI encoded
        if (objects.includes(encodeURIComponent(w1)) || objects.includes(encodeURIComponent(a1))) {
          foundVariant = true;
          break;
        }
        // case-insensitive
        if (objects.find(o => o.toLowerCase() === w1.toLowerCase() || o.toLowerCase() === a1.toLowerCase())) {
          foundVariant = true;
          break;
        }
      }
      if (foundVariant) continue;
      missing.push(fn);
    }

    console.log('\n--- Summary ---');
    console.log('Planned filenames:', planned.length);
    console.log('Objects in bucket:', objects.length);
    console.log('Missing files:', missing.length);
    if (missing.length > 0) {
      console.log('\nMissing filenames (first 200 shown):');
      console.log(missing.slice(0, 200).join('\n'));
      process.exit(3);
    } else {
      console.log('\nAll planned filenames have corresponding objects in Logos/generated');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error checking generated objects:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
