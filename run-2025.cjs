const fs = require('fs');
let code = fs.readFileSync('./src/utils/pdfParser.js', 'utf-8');
code = code.replace(/import \* as pdfjsLib from 'pdfjs-dist';/g, 'const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");');
code = code.replace(/export async function/g, 'async function');
code = 'const fs = require("fs");\n' + code;
code = code.replace(/pdfjsLib\.GlobalWorkerOptions\.workerSrc.*?;/g, '');
code += `
async function run() {
  const data = new Uint8Array(fs.readFileSync('./public/invoices/2025091.pdf'));
  const file = { arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
  const r = await parsePdfInvoice(file, []); 
  console.log("INV NUMBER:", r.invoice_number);
  console.log("DATE:", r.invoice_date);
  console.log("CLIENT:");
  r.client_details.forEach(l => console.log("- " + l));
}
run().catch(console.error);
`;
fs.writeFileSync('./runcjs.cjs', code);
