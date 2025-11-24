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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) in your environment.');
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

  console.log('Phone normalization script');
  console.log('Mode:', dryRun ? 'DRY RUN (default)' : doApply ? 'APPLY' : 'DRY RUN');

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
      subscriptionChanges.push({ id: s.id, company_id: s.company_id, from: s.phone, to: normalized });
    }
  }

  console.log(`Found ${companyChanges.length} companies with phone changes`);
  console.log(`Found ${subscriptionChanges.length} subscriptions with phone changes`);

  if (dryRun && !doApply) {
    console.log('\n--- DRY RUN RESULTS ---');
    console.log('Companies to change:');
    companyChanges.slice(0, 200).forEach(c => console.log(`${c.id}: ${c.name} — "${c.from}" -> "${c.to}"`));
    console.log('\nSubscriptions to change:');
    subscriptionChanges.slice(0, 200).forEach(s => console.log(`${s.id}: company ${s.company_id} — "${s.from}" -> "${s.to}"`));
    console.log('\nTo apply changes: run with --apply');
    return;
  }

  if (doApply) {
    console.log('\nApplying changes...');
    for (const c of companyChanges) {
      const { error } = await client.from('companies').update({ phone: c.to }).eq('id', c.id);
      if (error) console.error('Failed to update company', c.id, error.message);
      else console.log('Updated company', c.id, c.name, '->', c.to);
    }
    for (const s of subscriptionChanges) {
      const { error } = await client.from('event_subscriptions').update({ phone: s.to }).eq('id', s.id);
      if (error) console.error('Failed to update subscription', s.id, error.message);
      else console.log('Updated subscription', s.id, 'company', s.company_id, '->', s.to);
    }
    console.log('Done applying phone normalizations.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
