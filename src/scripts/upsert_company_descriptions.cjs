#!/usr/bin/env node
// Idempotent upsert for company descriptions scraped into out/companies_found.json
// Usage:
//  SUPABASE_URL=... SUPABASE_KEY=... node src/scripts/upsert_company_descriptions.cjs [--dry-run] [--skip-empty]
// Note: For production writes you should use a Supabase service_role key for full privileges.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const dryRun = process.argv.includes('--dry-run');
const skipEmpty = process.argv.includes('--skip-empty');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
  console.error('Provide a Supabase service_role key (recommended) or a write-capable key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const inPath = path.join(__dirname, '..', '..', 'out', 'companies_found.json');
  if (!fs.existsSync(inPath)) {
    console.error('Input file not found:', inPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(inPath, 'utf8');
  const companies = JSON.parse(raw);

  console.log(`Loaded ${companies.length} companies from ${inPath}`);

  let stats = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  for (const company of companies) {
    const id = company.id;
    if (!id) {
      console.warn('Skipping entry without id', company.name || company.website || company);
      stats.skipped++;
      continue;
    }

    const picked = company.picked || {};
    const languages = ['nl', 'en', 'de'];

    for (const lang of languages) {
      const candidate = picked[lang];
      if (!candidate || !candidate.text) {
        if (skipEmpty) {
          stats.skipped++;
          continue;
        }
      }

      const info = candidate ? String(candidate.text).trim() : null;
      if (!info) {
        if (skipEmpty) {
          stats.skipped++;
          continue;
        }
      }

      const row = { company_id: id, language_code: lang, info };

      if (dryRun) {
        console.log('DRY:', JSON.stringify(row));
        continue;
      }

      try {
        // Check existing translation
        const { data: existing, error: selErr } = await supabase
          .from('company_translations')
          .select('id, info')
          .eq('company_id', id)
          .eq('language_code', lang)
          .limit(1)
          .maybeSingle();

        if (selErr) {
          console.error('Select error for', id, lang, selErr.message || selErr);
          stats.errors++;
          continue;
        }

        if (existing && existing.info && existing.info.trim() === (info || '').trim()) {
          // identical — skip
          stats.skipped++;
          continue;
        }

        if (!existing) {
          const { error: insertErr } = await supabase.from('company_translations').insert([row]);
          if (insertErr) {
            console.error('Insert error', id, lang, insertErr.message || insertErr);
            stats.errors++;
          } else {
            console.log('Inserted', id, lang);
            stats.inserted++;
          }
        } else {
          // update existing
          const { error: updErr } = await supabase
            .from('company_translations')
            .update({ info: info })
            .eq('id', existing.id);

          if (updErr) {
            console.error('Update error', id, lang, updErr.message || updErr);
            stats.errors++;
          } else {
            console.log('Updated', id, lang);
            stats.updated++;
          }
        }
      } catch (err) {
        console.error('Unexpected error for', id, lang, err && err.message ? err.message : err);
        stats.errors++;
      }
    }
  }

  console.log('Done. Stats:', stats);
}

main().then(()=>process.exit(0)).catch(err=>{console.error(err); process.exit(1);});
