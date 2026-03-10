const fs = require('fs');
let code = fs.readFileSync('temp_pdf_test.cjs', 'utf-8');
code = code.replace(/import \* as pdfjsLib from 'pdfjs-dist';/g, 'const pdfjsLib = require(\'pdfjs-dist/legacy/build/pdf.js\');');
code = code.replace(/export async function/g, 'async function');
code += `

async function run() {
  const data = new Uint8Array(fs.readFileSync('./public/invoices/2026014.pdf'));
  // Fake File object
  const file = {
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  };
  
  console.log('--- RAW LINE ITEMS BEFORE FILTERING ---');
  const resultAll = await parsePdfInvoice(file, []);
  console.log(JSON.stringify(resultAll.line_items, null, 2));

  console.log('\\n--- SAME INVOICE, BUT WE ADDED "Het Land Rover Kompas" TO ALLOWED LIST ---');
  const resultFiltered = await parsePdfInvoice(file, ['Land Rover Kompas']);
  console.log(JSON.stringify(resultFiltered.line_items, null, 2));

  console.log('\\n--- SAME INVOICE, BUT ONLY "Frühstück" IS ALLOWED ---');
  const resultEmpty = await parsePdfInvoice(file, ['Frühstück']);
  console.log(JSON.stringify(resultEmpty.line_items, null, 2));
}
run().catch(console.error);
`;
fs.writeFileSync('temp_pdf_runner.cjs', code);
