const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');
const pdf = pdfLib.default || pdfLib;

const INVOICE_DIR = path.join(process.cwd(), 'invoices_to_scan');
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'invoices', 'parsed_invoices.json');

async function processInvoices() {
  const files = fs.readdirSync(INVOICE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log(`No PDFs found in ${INVOICE_DIR}.`);
    return;
  }

  console.log(`Found ${files.length} PDFs to process... Testing the first 5.`);
  const parsedData = [];

  for (const file of files.slice(0, 5)) {
    const filePath = path.join(INVOICE_DIR, file);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const text = data.text;
      
      console.log(`\n--- Extracted from ${file} ---`);
      console.log(text.substring(0, 1000) + '...\n'); // Show first 1000 chars to see pattern
      
      parsedData.push({
        filename: file,
        raw_text: text,
      });
      
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parsedData, null, 2));
  console.log(`\nDone! Wrote test raw data to ${OUTPUT_FILE}`);
}

processInvoices();
