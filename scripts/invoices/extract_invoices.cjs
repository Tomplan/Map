const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');
const pdf = pdfLib.default || pdfLib;

const INVOICE_DIR = path.join(process.cwd(), 'invoices_to_scan');
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'invoices', 'parsed_invoices.json');

// Helper to cleanly parse an invoice text
function parseInvoiceText(text, filename) {
  const result = {
    filename,
    invoice_number: null,
    company_name: null,
    email: null,
    phone: null,
    stands_count: 0,
    meals_count: 0,
    area_preference: [],
    notes: null,
    is_relevant: false,
    raw_debug: null
  };

  try {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Find Invoice Number
    const invIndex = lines.indexOf('Factuurnummer');
    if (invIndex !== -1 && lines.length > invIndex + 1) {
      result.invoice_number = lines[invIndex + 1];
    }

    // 2. Find Company Name & Contact Info
    const startIdx = lines.indexOf('Factuur');
    const endIdx = lines.findIndex(l => l.includes('Land Rover Club Holland'));
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      // Company name is usually exactly 1 line below 'Factuur'
      result.company_name = lines[startIdx + 1];
      
      const contactSection = lines.slice(startIdx + 1, endIdx);
      
      // Look for Email
      const emailLine = contactSection.find(l => l.includes('@'));
      if (emailLine) result.email = emailLine;
      
      // Look for Phone (starts with +, or numeric block)
      const phoneLine = contactSection.find(l => /^(\+|0)\d{9,14}$/.test(l.replace(/\s+/g,'')));
      if (phoneLine) result.phone = phoneLine;
    }

    // 3. Find Items / Stands / Meals
    let itemSectionStart = lines.findIndex(l => l.startsWith('ItemAantalPer stukPrijs'));
    const itemSectionEnd = lines.findIndex(l => l.startsWith('Verzendkosten'));
    
    if (itemSectionStart !== -1 && itemSectionEnd !== -1 && itemSectionEnd > itemSectionStart) {
      const items = lines.slice(itemSectionStart + 1, itemSectionEnd);
      
      for (const itemLine of items) {
        // We use Math to determine the quantity because the item name and quantity get smushed together (e.g. "Veld 21€" = Veld 2, Qty 1)
        const mathPattern = /€\s*([\d.,]+)€\s*([\d.,]+)$/;
        const mathMatch = itemLine.match(mathPattern);
        
        let qty = 0;
        if (mathMatch) {
          const perStuk = parseFloat(mathMatch[1].replace('.', '').replace(',', '.'));
          const totaal = parseFloat(mathMatch[2].replace('.', '').replace(',', '.'));
          qty = perStuk > 0 ? Math.round(totaal / perStuk) : 1;
        }
        
        if (itemLine.toLowerCase().includes('standhuur') || itemLine.toLowerCase().includes('stand')) {
          let multiplier = 1;
          if (itemLine.toLowerCase().includes('6x12') || itemLine.toLowerCase().includes('6 x 12') || itemLine.toLowerCase().includes('dubbele')) {
            multiplier = 2;
          }
          result.stands_count += (qty * multiplier);
          result.is_relevant = true;
          
          // Clean area extraction: pull text after slash but before the quantity+price chunk
          const areaMatch = itemLine.match(/\/\s*(.*?)(\d*€\s*[\d.,]+€\s*[\d.,]+$)/);
          if (areaMatch && areaMatch[1]) {
            result.area_preference.push(areaMatch[1].trim());
          }
        }
        
        if (itemLine.toLowerCase().includes('bbq') || itemLine.toLowerCase().includes('ontbijt') || itemLine.toLowerCase().includes('meal')) {
          result.meals_count += qty;
          result.is_relevant = true;
        }
      }
    }

    // 4. Find Notes / Opmerking
    const opmerkingIdx = lines.findIndex(l => l.includes('Opmerking'));
    if (opmerkingIdx !== -1 && lines.length > opmerkingIdx + 1) {
      let noteLine = lines[opmerkingIdx + 1];
      // JouwWeb sometimes smashes 'Betaald via iDEAL' and the note together.
      if (noteLine.startsWith('Betaald via iDEAL')) {
        noteLine = noteLine.replace('Betaald via iDEAL', '').trim();
      }
      if (noteLine) {
        result.notes = noteLine;
      }
    }

    result.area_preference = [...new Set(result.area_preference)].join(', ');

  } catch (err) {
    result.raw_debug = "Parser failed: " + err.message;
  }
  
  return result;
}

async function processAll() {
  const files = fs.readdirSync(INVOICE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Found ${files.length} PDFs to process...`);
  
  const parsedData = [];

  for (const file of files) {
    try {
      const dataBuffer = fs.readFileSync(path.join(INVOICE_DIR, file));
      const data = await pdf(dataBuffer);
      const invoiceData = parseInvoiceText(data.text, file);
      parsedData.push(invoiceData);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  // Save full JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parsedData, null, 2));
  console.log(`\nDone! Wrote ${parsedData.length} records to ${OUTPUT_FILE}`);
  
  // Print summary of what we found!
  console.log('\n--- Summary of Relevant Invoices ---');
  parsedData.filter(d => d.is_relevant).slice(0, 10).forEach(d => {
    console.log(`[Inv ${d.invoice_number}] ${d.company_name} | Stands: ${d.stands_count} | Meals: ${d.meals_count} | Area: ${d.area_preference} | Notes: ${d.notes || 'none'}`);
  });
}

processAll();
