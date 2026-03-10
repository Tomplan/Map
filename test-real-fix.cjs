const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfParser.js', 'utf-8');
code = code.replace(/import \* as pdfjsLib from 'pdfjs-dist';/g, 'const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");');
code = code.replace(/export async function/g, 'async function');
code = 'const fs = require("fs");\n' + code;
code = code.replace(/pdfjsLib\.GlobalWorkerOptions\.workerSrc.*?;/g, '');

code += `
async function run() {
  const data = new Uint8Array(fs.readFileSync('./public/invoices/2025091.pdf'));
  const file = { arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
  const result = await parsePdfInvoice(file, []);
  console.log("INVOICE NUMBER EXTRACTED:", result.invoice_number);
}
run().catch(console.error);
`;
fs.writeFileSync('test-real-fix-runner.cjs', code);
