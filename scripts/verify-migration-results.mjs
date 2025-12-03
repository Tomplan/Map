#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  try {
    const comp = await supabase.from('companies').select('id, logo').ilike('logo', '%/Logos/generated/%').limit(10);
    if (comp.error) throw comp.error;
    const compCount = await supabase.from('companies').select('id', { count: 'exact', head: true }).match({}).ilike('logo', '%/Logos/generated/%');

    const markers = await supabase.from('markers_content').select('id, logo, event_year').ilike('logo', '%/Logos/generated/%').limit(10);
    if (markers.error) throw markers.error;
    const markersCountHead = await supabase.from('markers_content').select('id', { count: 'exact', head: true }).ilike('logo', '%/Logos/generated/%');

    console.log('Sample updated companies (up to 10):');
    console.table(comp.data || []);
    console.log('Companies count now pointing to generated:', compCount.count || 0);

    console.log('\nSample updated markers_content (up to 10):');
    console.table(markers.data || []);
    console.log('Markers_content count now pointing to generated:', markersCountHead.count || 0);

  } catch (err) {
    console.error('Error querying DB:', err.message || err);
    process.exit(1);
  }
}

run();
