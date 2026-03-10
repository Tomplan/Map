import fs from 'fs';
import { parsePdfInvoice } from './src/utils/pdfParser.js';

(async () => {
    console.log('starting parse');
    try {
      const data = fs.readFileSync('./public/invoices/2025058.pdf');
      const file = {
        arrayBuffer: async () =>
          data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      };
      const res = await parsePdfInvoice(file, []);
      console.log('result', JSON.stringify(res, null, 2));
    } catch (e) {
      console.error('parse error', e);
    }
})();
