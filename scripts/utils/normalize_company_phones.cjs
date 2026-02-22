#!/usr/bin/env node
/*
  normalize_company_phones.cjs

  Scans `companies` and `event_subscriptions` phone fields and normalizes them to E.164
  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node src/scripts/normalize_company_phones.cjs --dry-run
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node src/scripts/normalize_company_phones.cjs --apply

  NOTE: This requires a service role key (with write permissions) or a key with update permissions.
*/

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

dotenv.config();

// Support both VITE_ prefixed and non-prefixed environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Please set SUPABASE_URL and SUPABASE_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) in your environment.',
  );
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalize(phone, defaultCountry = 'NL') {
  if (!phone && phone !== '') return null;
  const raw = String(phone).trim();
  if (raw === '') return null;
  let parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (parsed && parsed.isValid()) return parsed.format('E.164');
  let cleaned = raw.replace(/[()\s.-]+/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  parsed = parsePhoneNumberFromString(cleaned);
  if (parsed && parsed.isValid()) return parsed.format('E.164');
  const digitsOnly = raw.replace(/[^0-9+]+/g, '');
  return digitsOnly || raw;
}

async function fetchAll(table, selectCols) {
  const { data, error } = await client.from(table).select(selectCols);
  if (error) throw error;
  return data || [];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.length === 0;
  const doApply = args.includes('--apply');

  process.stdout.write('Phone normalization script\n');
  process.stdout.write(
    'Mode: ' + (dryRun ? 'DRY RUN (default)' : doApply ? 'APPLY' : 'DRY RUN') + '\n',
  );

  // Gather targets
  const companies = await fetchAll('companies', 'id,phone,name');
  const subscriptions = await fetchAll('event_subscriptions', 'id,phone,company_id');

  const companyChanges = [];
  for (const c of companies) {
    const normalized = normalize(c.phone || '');
    if (normalized !== (c.phone || '').trim()) {
      companyChanges.push({ id: c.id, name: c.name, from: c.phone, to: normalized });
    }
  }

  const subscriptionChanges = [];
  for (const s of subscriptions) {
    const normalized = normalize(s.phone || '');
    if (normalized !== (s.phone || '').trim()) {
      subscriptionChanges.push({
        id: s.id,
        company_id: s.company_id,
        from: s.phone,
        to: normalized,
      });
    }
  }

  process.stdout.write(`Found ${companyChanges.length} companies with phone changes\n`);
  process.stdout.write(`Found ${subscriptionChanges.length} subscriptions with phone changes\n`);

  if (dryRun && !doApply) {
    process.stdout.write('\n--- DRY RUN RESULTS ---\n');
    process.stdout.write('Companies to change:\n');
    companyChanges
      .slice(0, 200)
      .forEach((c) => process.stdout.write(`${c.id}: ${c.name} — "${c.from}" -> "${c.to}"\n`));
    process.stdout.write('\nSubscriptions to change:\n');
    subscriptionChanges
      .slice(0, 200)
      .forEach((s) =>
        process.stdout.write(`${s.id}: company ${s.company_id} — "${s.from}" -> "${s.to}"\n`),
      );
    process.stdout.write('\nTo apply changes: run with --apply\n');
    return;
  }

  if (doApply) {
    process.stdout.write('\nApplying changes...\n');
    for (const c of companyChanges) {
      const { error } = await client.from('companies').update({ phone: c.to }).eq('id', c.id);
      if (error) console.error('Failed to update company', c.id, error.message);
      else process.stdout.write('Updated company ' + c.id + ' ' + c.name + ' -> ' + c.to + '\n');
    }
    for (const s of subscriptionChanges) {
      const { error } = await client
        .from('event_subscriptions')
        .update({ phone: s.to })
        .eq('id', s.id);
      if (error) console.error('Failed to update subscription', s.id, error.message);
      else
        process.stdout.write(
          'Updated subscription ' + s.id + ' company ' + s.company_id + ' -> ' + s.to + '\n',
        );
    }
    process.stdout.write('Done applying phone normalizations.\n');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
