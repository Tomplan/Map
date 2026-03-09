require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function upload() {
  const file = path.join(process.cwd(), 'scripts', 'invoices', 'parsed_invoices.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8')).filter(d => d.is_relevant);
  
  console.log(`Uploading ${data.length} relevant invoices to Supabase...`);
  
  for(const inv of data) {
    const payload = {
        invoice_number: inv.invoice_number,
        company_name: inv.company_name,
        email: inv.email,
        phone: inv.phone,
        stands_count: inv.stands_count,
        meals_count: inv.meals_count,
        area_preference: inv.area_preference,
        notes: inv.notes,
        is_relevant: inv.is_relevant,
        status: 'pending'
    };
    
    // Upsert by invoice_number
    const { error } = await supabase.from('staged_invoices').upsert(payload, { onConflict: 'invoice_number' });
    
    if(error){
        console.error(`Failed to upload ${inv.invoice_number}:`, error.message);
    }
  }
  
  console.log('Upload complete!');
}
upload();
