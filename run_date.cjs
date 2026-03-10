const fs = require('fs');
async function run() {
  const data = new Uint8Array(fs.readFileSync('./public/invoices/2026014.pdf'));
  const file = { arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
  const { parsePdfInvoice } = await import('./src/utils/pdfParser.js?t=' + Date.now()); // hack for native ESM or reuse old build
}
