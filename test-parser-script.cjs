const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function testParse() {
  const data = new Uint8Array(fs.readFileSync('./public/invoices/2026014.pdf'));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  let allItems = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageItems = textContent.items.map(item => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5]
    }));
    allItems = allItems.concat(pageItems);
  }

  const items = allItems;
  items.sort((a, b) => {
    if (Math.abs(b.y - a.y) < 5) return a.x - b.x;
    return b.y - a.y;
  });

  const parsed = { line_items: [] };
  let inLineItems = false;
  let lines = [];
  let currentLine = [];
  let currentY = null;

  items.forEach(item => {
    if (currentY === null || Math.abs(currentY - item.y) > 5) {
      if (currentLine.length > 0) lines.push(currentLine);
      currentLine = [item];
      currentY = item.y;
    } else {
      currentLine.push(item);
    }
  });
  if (currentLine.length > 0) lines.push(currentLine);

  lines.forEach(line => {
    line.sort((a, b) => a.x - b.x);
    const lineText = line.map(i => i.text).join(' ').trim();
    const lowerText = lineText.toLowerCase();

    if (lowerText.includes('aantal') && lowerText.includes('eenheidsprijs')) {
      inLineItems = true;
      return;
    }
    
    if (inLineItems) {
      if (lowerText.includes('subtotaal') || lowerText.includes('btw') || lowerText.includes('totaal te betalen')) {
        inLineItems = false;
        return;
      }
      
      const parts = lineText.split(/\s+/);
      const possibleQty = parseInt(parts[0]);
      
      if (!isNaN(possibleQty) && possibleQty > 0 && possibleQty < 100) {
        let description = parts.slice(1).join(' ');
        const currencyMatchIndex = description.match(/€|\d+,\d{2}/)?.index;
        if (currencyMatchIndex > 0) {
          description = description.substring(0, currencyMatchIndex).trim();
        }
        if (description) {
          parsed.line_items.push({ quantity: possibleQty, description: description });
        }
      } else {
        if (parsed.line_items.length > 0) {
           if (!lowerText.includes('subtotaal') && !lowerText.includes('btw') && !lowerText.includes('totaal') && !lowerText.includes('iban') && !lowerText.includes('betaal')) {
             parsed.line_items[parsed.line_items.length - 1].description += " " + lineText;
           }
        }
      }
    }
  });

  console.log(JSON.stringify(parsed.line_items, null, 2));
}

testParse().catch(console.error);
