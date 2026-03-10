const fs = require('fs');
let code = fs.readFileSync('./src/utils/pdfParser.js', 'utf-8');
code = code.replace(/import \* as pdfjsLib from 'pdfjs-dist';/g, 'const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");');
code = code.replace(/export async function/g, 'async function');
code = 'const fs = require("fs");\n' + code;
code = code.replace(/pdfjsLib\.GlobalWorkerOptions\.workerSrc.*?;/g, '');

code += `
async function run() {
  const data = new Uint8Array(fs.readFileSync('./public/invoices/2026014.pdf'));
  const file = {
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  };
  const result = await parsePdfInvoice(file, []);
  console.log("COMPANY NAME:", result.company_name);
  console.log("CLIENT DETAILS:");
  console.log(JSON.stringify(result.client_details, null, 2));
}
run().catch(console.error);
`;
fs.writeFileSync('./run_client.cjs', code);
