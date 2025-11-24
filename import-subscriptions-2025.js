import { createClient } from '@supabase/supabase-js';
import normalizePhone from './src/utils/phone.js';
import XLSX from 'xlsx';

// Supabase credentials
const supabaseUrl = 'https://xtkbvnnkovogqwcwdhkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0a2J2bm5rb3ZvZ3F3Y3dkaGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzg5ODEsImV4cCI6MjA3NjgxNDk4MX0.71MqQy05baMcDaGI5Xq_fUbcjgGvA0rjnNuXtacEwKs';

// You need to set your JWT token here - get it from browser DevTools:
// 1. Open the app in browser and log in
// 2. Open DevTools → Application → Local Storage → find supabase.auth.token
// 3. Copy the access_token value and paste it below
const USER_JWT_TOKEN = process.env.SUPABASE_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsImtpZCI6IncrTGZCa0dNUzB6SkViK3UiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3h0a2J2bm5rb3ZvZ3F3Y3dkaGtnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0OWE4NzZlYS01Y2ZkLTRiNzktOTFjMC1jNmUxOTliNTBmMTQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyOTcyMzEzLCJpYXQiOjE3NjI5Njg3MTMsImVtYWlsIjoib3JnYW5pc2F0aWVANHg0dmFrYW50aWViZXVycy5ubCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYyNjI0MzMwfV0sInNlc3Npb25faWQiOiJkNDlkOTM2ZC1kMzM0LTQ3YWEtYWJiOS0xY2UyMmVkZTFlNWQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.-I_bzpta4q5pL79S0AhXWLxKE_-Rs2-Xp0p49w5P-kw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Authorization: `Bearer ${USER_JWT_TOKEN}`
    }
  }
});

async function importSubscriptions() {
  console.log('Starting import for 2025...\n');

  // Read Excel file
  const workbook = XLSX.readFile('/Users/tom/Downloads/lijst standhouders update 27-9-25.xlsx');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${excelData.length} rows in Excel\n`);

  // Fetch all companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name');

  if (companiesError) {
    console.error('Error fetching companies:', companiesError);
    return;
  }

  // Create company name to ID map (case-insensitive)
  const companyMap = {};
  companies.forEach(company => {
    companyMap[company.name.toLowerCase().trim()] = company.id;
  });

  // Fetch all existing subscriptions for 2025
  const { data: existingSubscriptions, error: subsError } = await supabase
    .from('event_subscriptions')
    .select('id, company_id')
    .eq('event_year', 2025);

  if (subsError) {
    console.error('Error fetching subscriptions:', subsError);
    return;
  }

  // Create company_id to subscription_id map
  const subscriptionMap = {};
  existingSubscriptions.forEach(sub => {
    subscriptionMap[sub.company_id] = sub.id;
  });

  console.log(`Found ${companies.length} companies in database`);
  console.log(`Found ${existingSubscriptions.length} existing subscriptions for 2025\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let companiesUpdated = 0;

  // Process each row
  for (let i = 0; i < excelData.length; i++) {
    const row = excelData[i];
    const companyName = row['Bedrijfsnaam']?.toString().trim();

    if (!companyName) {
      console.log(`Row ${i + 1}: No company name, skipping`);
      skipped++;
      continue;
    }

    // Find company ID
    const companyId = companyMap[companyName.toLowerCase()];
    if (!companyId) {
      console.log(`Row ${i + 1}: Company "${companyName}" not found in database`);
      errors++;
      continue;
    }

    // Prepare company updates (contact info only)
    const companyUpdates = {};
    if (row['Volledige naam']) {
      companyUpdates.contact = row['Volledige naam'].toString().trim();
    }
    if (row['telefoon nr']) {
      companyUpdates.phone = normalizePhone(row['telefoon nr'].toString().trim());
    }
    if (row['e-mail']) {
      companyUpdates.email = row['e-mail'].toString().trim();
    }

    // Update company table with contact info
    if (Object.keys(companyUpdates).length > 0) {
      const { error: companyUpdateError } = await supabase
        .from('companies')
        .update(companyUpdates)
        .eq('id', companyId);

      if (companyUpdateError) {
        console.error(`Row ${i + 1}: Error updating company "${companyName}":`, companyUpdateError.message);
      } else {
        console.log(`✓ Row ${i + 1}: Updated company "${companyName}" (${Object.keys(companyUpdates).join(', ')})`);
        companiesUpdated++;
      }
    }

    // Check if subscription exists
    const subscriptionId = subscriptionMap[companyId];
    if (!subscriptionId) {
      console.log(`Row ${i + 1}: Company "${companyName}" not subscribed to 2025, skipping subscription update`);
      skipped++;
      continue;
    }

    // Prepare subscription update data
    const updates = {};

    // Contact info
    if (row['Volledige naam']) {
      updates.contact = row['Volledige naam'].toString().trim();
    }

    if (row['telefoon nr']) {
      updates.phone = normalizePhone(row['telefoon nr'].toString().trim());
    }

    if (row['e-mail']) {
      updates.email = row['e-mail'].toString().trim();
    }

    // Booth count
    if (row['standplaatsen']) {
      updates.booth_count = parseInt(row['standplaatsen']) || 1;
    }

    // Coins
    if (row['Munten']) {
      updates.coins = parseInt(row['Munten']) || 0;
    }

    // Notes
    if (row['opmerking']) {
      updates.notes = row['opmerking'].toString().trim();
    }

    // Saturday meals (only if they have values)
    if (row['BBQ']) {
      updates.bbq_sat = parseInt(row['BBQ']) || 0;
    }
    if (row['Ontbijt']) {
      updates.breakfast_sat = parseInt(row['Ontbijt']) || 0;
    }
    if (row['Lunch']) {
      updates.lunch_sat = parseInt(row['Lunch']) || 0;
    }

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      console.log(`Row ${i + 1}: No subscription data to update for "${companyName}"`);
      skipped++;
      continue;
    }

    // Update subscription
    const { error: updateError } = await supabase
      .from('event_subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    if (updateError) {
      console.error(`Row ${i + 1}: Error updating subscription for "${companyName}":`, updateError.message);
      errors++;
    } else {
      console.log(`✓ Row ${i + 1}: Updated subscription for "${companyName}" (${Object.keys(updates).join(', ')})`);
      updated++;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Companies Updated: ${companiesUpdated}`);
  console.log(`✓ Subscriptions Updated: ${updated}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total processed: ${excelData.length}`);
}

// Run the import
importSubscriptions().catch(console.error);
