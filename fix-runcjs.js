const fs = require('fs');

let code = fs.readFileSync('runcjs.cjs', 'utf-8');
const exactCode = fs.readFileSync('src/utils/pdfParser.js', 'utf-8');

// The standalone script needs the function updated too.
// Just wipe the parsePdfInvoice from runcjs and replace it with the new one.

const funcStart = code.indexOf('async function parsePdfInvoice');
const newFuncStart = exactCode.indexOf('export async function parsePdfInvoice');

const originalFunc = code.substring(funcStart);
let newFunc = exactCode.substring(newFuncStart).replace('export async function', 'async function');

code = code.substring(0, funcStart) + newFunc;

// the new pdfParser.js imports parsePdfInvoice fallback, but in runcjs it's standalone,
// let's just make it simple.
