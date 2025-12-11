#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const filenames = [
  '1762803448156_1756d1.png',
  '1762803399988_po4ce0.png',
  '1762803390274_wsd8xn.webp',
  '1762803412883_eucr4f.png',
  '1762803454469_3p9xpz.jpg',
  '1764017982440_h4cyic.jpeg',
  '1762803420948_3cy65g.png',
  '1762803351448_mfq3ab.jpg',
  '1762803431544_xfrpwe.png',
  '1762803439792_le7fpj.webp',
];

(async function main() {
  try {
    console.log('Listing Logos/companies (first 2000)');
    const list = await supabase.storage.from('Logos').list('companies', { limit: 2000 });
    if (list.error) throw list.error;
    const objects = list.data.map((o) => o.name);
    console.log(`Found ${objects.length} objects in Logos/companies`);
    const report = filenames.map((fn) => ({
      filename: fn,
      exists: objects.includes(fn) || objects.includes(encodeURIComponent(fn)),
    }));
    console.table(report);
    const missing = report.filter((r) => !r.exists).map((r) => r.filename);
    if (missing.length) {
      console.log('Missing in Logos/companies:', missing.length);
      missing.forEach((m) => console.log('  -', m));
      process.exit(3);
    }
    console.log('All listed filenames exist under Logos/companies');
  } catch (err) {
    console.error('error:', err.message || err);
    process.exit(1);
  }
})();
