const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfParser.js', 'utf-8');
code = code.replace(/parsed\.invoice_number = match\[1\]\.trim\(\);/g, 'parsed.invoice_number = "REGEX_1_" + match[1].trim();');
code = code.replace(/parsed\.invoice_number = fItem\.str\.trim\(\);/g, 'parsed.invoice_number = "REGEX_2_" + fItem.str.trim();');
code = code.replace(/parsed\.invoice_number = lineItems\[fNumIndex \+ i\]\.str\.trim\(\);/g, 'parsed.invoice_number = "INDEX_0_" + lineItems[fNumIndex + i].str.trim();');
fs.writeFileSync('src/utils/pdfParser-spy.js', code);
