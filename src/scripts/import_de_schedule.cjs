#!/usr/bin/env node
// Import script for German schedule JSON into Supabase event_activities table
// Usage: SUPABASE_URL=... SUPABASE_KEY=... node import_de_schedule.cjs [--dry-run]

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const dryRun = process.argv.includes('--dry-run');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const filePath = path.join(__dirname, '..', 'data', 'de_schedule.json');
  if (!fs.existsSync(filePath)) {
    console.error('de_schedule.json not found at', filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const entries = JSON.parse(raw);

  process.stdout.write(`Loaded ${entries.length} entries from de_schedule.json\n`);

  for (const [idx, e] of entries.entries()) {
    // Map JSON keys to DB columns
    const row = {
      organization_id: e.organization_id || null,
      day: e.day,
      start_time: e.start_time,
      end_time: e.end_time,
      display_order: e.display_order || idx + 1,
      title_nl: e.title_nl || null,
      title_en: e.title_en || null,
      title_de: e.title_de || null,
      description_nl: e.description_nl || null,
      description_en: e.description_en || null,
      description_de: e.description_de || null,
      location_type: e.location_type || 'venue',
      company_id: e.company_id || null,
      location_nl: e.location_nl || null,
      location_en: e.location_en || null,
      location_de: e.location_de || null,
      badge_nl: e.badge_nl || null,
      badge_en: e.badge_en || null,
      badge_de: e.badge_de || null,
      is_active: e.is_active !== undefined ? e.is_active : true,
      show_location_type_badge: e.show_location_type_badge || false,
    };

    if (dryRun) {
      process.stdout.write('DRY: ' + JSON.stringify(row, null, 2) + '\n');
      continue;
    }

    // Optional idempotency: skip if exact title_de + start_time exists
    try {
      const { data: existing } = await supabase
        .from('event_activities')
        .select('id')
        .eq('title_de', row.title_de)
        .eq('start_time', row.start_time)
        .eq('day', row.day)
        .limit(1);

      if (existing && existing.length > 0) {
        // skipping existing entry
        continue;
      }

      const { error } = await supabase.from('event_activities').insert([row]);
      if (error) {
        console.error('Error inserting row:', error.message || error);
      } else {
        process.stdout.write('Inserted: ' + (row.title_de || row.title_en || 'untitled') + '\n');
      }
    } catch (err) {
      console.error('Unexpected error:', err.message || err);
    }
  }
}

main()
  .then(() => process.stdout.write('Done\n'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
