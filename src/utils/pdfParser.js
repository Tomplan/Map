// pdfjs-dist is heavy and uses CommonJS; importing at top-level trips Vite's
// import-analysis when bundling the frontend.  Load it dynamically inside the
// parser so the module only gets evaluated at runtime (and the build process
// can skip it).

export async function parsePdfInvoice(file, allowedItems = []) {
  // import legacy build for browser compatibility
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
  // Standard worker pattern. Hardcoded version to match package.json to prevent Vite export undefined issues.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let allItems = [];

    // Extract text items with XY coordinates from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageItems = textContent.items.map((item) => {
        return {
          str: item.str,
          x: item.transform[4],
          y: item.transform[5], // standard bottom-left origin
          height: item.height,
          width: item.width,
        };
      });

      allItems = allItems.concat(pageItems);
    }

    return parseSpatialInvoice(allItems, allowedItems);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

function parseSpatialInvoice(items, allowedItems) {
  // Sort items top-to-bottom. Y is higher for the top of the page.
  items.sort((a, b) => {
    // Treat items within 5 points of Y as being on the same line
    if (Math.abs(b.y - a.y) < 5) {
      return a.x - b.x; // sort left-to-right
    }
    return b.y - a.y; // sort top-to-bottom
  });

  const parsed = {
    invoice_number: null,
    invoice_date: null,
    company_name: null,
    client_details: [],
    line_items: [],
    opmerkingen: '',    notes: "",                // extracted from opmerkingen block    is_relevant: true,
  };

  const lines = [];
  let currentY = null;
  let currentLine = [];

  // Group into lines
  items.forEach((item) => {
    if (item.str.trim() === '') return;

    if (currentY === null || Math.abs(currentY - item.y) > 5) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentY = item.y;
      currentLine = [item];
    } else {
      currentLine.push(item);
    }
  });
  if (currentLine.length > 0) lines.push(currentLine);

  let inLineItems = false;
  let collectingClientDetails = true;

  lines.forEach((lineItems, index) => {
    const textChunk = lineItems
      .map((i) => i.str)
      .join(' ')
      .trim();
    const lowerText = textChunk.toLowerCase();

    // --- STRUCTURAL MARKERS ---
    // User Rule: "You will see the client details and then the date. ALWAYS!"
    // Therefore, if we see "Datum" or "Factuurnummer", the client block is finished.
    if (collectingClientDetails) {
      if (
        lowerText.includes('datum') ||
        lowerText.includes('factuurdatum') ||
        lowerText.includes('factuurnummer') ||
        lowerText.includes('factuur nr')
      ) {
        collectingClientDetails = false;
      }
    }

    // Detect if we've reached the line items table
    if (lowerText.includes('item') && lowerText.includes('aantal')) {
      inLineItems = true;
      collectingClientDetails = false; // Failsafe
      return;
    }
    // -------------------------

    // 0) Date Extraction (Datum)
    // Look for date patterns: "d MMM yyyy" (dutch) or "dd-mm-yyyy"
    // Regex for: 1 jan 2025, 12 dec 2024, 01-01-2025
    if (!parsed.invoice_date) {
      const dateMatch =
        textChunk.match(
          /(\d{1,2}\s+(?:jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\s+\d{4})/i,
        ) || textChunk.match(/(\d{1,2}[\-\.]\d{1,2}[\-\.]\d{4})/);
      if (dateMatch) {
        // Use heuristics: if line also says "Datum", it's definitely the date.
        // Or if it's near the top (index < 30).
        if (lowerText.includes('datum') || index < 30) {
          parsed.invoice_date = dateMatch[1];
        }
      }
    }

    // 1) Find Invoice Number
    if (!parsed.invoice_number) {
      if (lowerText.includes('factuurnummer') || lowerText.includes('factuur nr')) {
        // ALWAYS on the exact next line in the spatial block structure.
        if (lines[index + 1]) {
          const potentialNumbers = lines[index + 1]
            .map((i) => i.str.trim())
            .filter((str) => str.length >= 4);

          // We are looking for an item on the next line that is just a block of digits (e.g. 2025091)
          // and avoiding dates like "26 sep 2025" which contain letters or aren't a pure number sequence.
          const validChunk = potentialNumbers.find((str) =>
            /^F?\d{4,}$/.test(str.replace(/\s+/g, '')),
          );

          if (validChunk) {
            // strip spaces in case of weird kerning like '2 0 2 5 0 9 1'
            parsed.invoice_number = validChunk.replace(/\s+/g, '');
          }
        }

        // Inline fallback just in case 'Factuurnummer 2025091' actually is on a single line chunk
        if (!parsed.invoice_number || parsed.invoice_number.length < 3) {
          const inlineMatch = textChunk.match(/(?:Factuurnummer|Factuur nr)[:\.\s]+([A-Z0-9-]+)/i);
          if (inlineMatch) parsed.invoice_number = inlineMatch[1].trim();
        }
      }

      // Standalone pattern fallback (only if "Factuurnummer" text was never seen)
      if (!parsed.invoice_number && !lowerText.includes('factuurnummer')) {
        const fItem = lineItems.find((i) => /F202\d-\d{4}/.test(i.str));
        if (fItem) parsed.invoice_number = fItem.str.trim();
      }
    }

    // 4) Notes / Opmerkingen
    if (
      !parsed.notes &&
      (lowerText.includes('opmerkingen') || lowerText.includes('betreft'))
    ) {
      // Capture rest of line after keyword
      const noteStart = textChunk.replace(/.*(opmerkingen|betreft)[:\s]*/i, '').trim();
      if (noteStart.length > 2) {
        parsed.notes = noteStart;
      }
      // We might want to capture subsequent lines too if needed (multi-line notes)
    } else if (
      parsed.notes &&
      !lowerText.includes('totaal') &&
      !lowerText.includes('btw') &&
      !lowerText.includes('iban') &&
      !inLineItems
    ) {
      // Continue capturing notes if we found "Opmerkingen" previously and aren't in another section
      parsed.notes += ' ' + textChunk;
    }

    // 5) Client Block (top-left, x < 300)
    // Only collect if we are still in the top section before Date/InvoiceNum
    if (collectingClientDetails && !inLineItems) {
      const leftItems = lineItems.filter((i) => i.x < 300);

      if (leftItems.length > 0) {
        const leftText = leftItems
          .map((i) => i.str)
          .join(' ')
          .trim();
        // Ignore headers like "Factuur" if it appears above
        if (leftText && !lowerText.includes('factuur') && !lowerText.includes('pagina')) {
          parsed.client_details.push(leftText);
          // The first recognized text in the left block is usually the company name
          if (!parsed.company_name) {
            parsed.company_name = leftText;
          }
        }
      }
    }

    if (
      inLineItems &&
      (lowerText.includes('totaal') ||
        lowerText.includes('btw') ||
        lowerText.includes('iban') ||
        lowerText.includes('betaal'))
    ) {
      inLineItems = false;
    }

    // 3) Parse Line Items (requires spatial gap detection)
    if (inLineItems) {
      // If a line has multiple distinct X coordinates separated significantly
      if (lineItems.length >= 2) {
        let qty = 1;

        // Search in middle columns (x usually between 200 and 450) for a number
        let qtyItem = lineItems.find((i) => i.x > 200 && i.x < 450 && /^\s*\d+\s*$/.test(i.str));
        if (qtyItem) {
          qty = parseInt(qtyItem.str.trim(), 10);
        } else {
          // Fallback regex matching
          const qMatch = textChunk.match(/\b(\d+)\s+x\s+/i);
          if (qMatch) qty = parseInt(qMatch[1], 10);
          else {
            const qMatch2 = textChunk.match(/\b(\d+)[.,]00\b/);
            if (qMatch2 && lineItems[0].str !== qMatch2[0]) qty = parseInt(qMatch2[1], 10);
          }
        }

        // Description is left-aligned, but we must exclude the item identified as the quantity
        const descItems = lineItems.filter((i) => i.x < 300 && i !== qtyItem);
        let descMatch = descItems
          .map((i) => i.str)
          .join(' ')
          .trim();

        // Failsafe in case a different quantity regex trapped it, strip solitary numbers at the end
        descMatch = descMatch.replace(/\s+\d+$/, '').trim();

        // Price is usually right-aligned
        const priceItem = lineItems[lineItems.length - 1];

        if (descMatch && descMatch.length > 2) {
          // split off area information after a slash if present
          let area = null;
          let itemText = descMatch;
          const slashIdx = descMatch.indexOf('/');
          if (slashIdx !== -1) {
            itemText = descMatch.slice(0, slashIdx).trim();
            area = descMatch.slice(slashIdx + 1).trim();
          }
          parsed.line_items.push({
            item: itemText,
            area,
            quantity: qty,
            price: priceItem ? priceItem.str : '',
          });
        }
      } else if (lineItems.length === 1 && lineItems[0].x < 250) {
        // Only 1 item, but placed left. Likely a multi-line description continuation.
        if (parsed.line_items.length > 0) {
          if (
            !lowerText.includes('subtotaal') &&
            !lowerText.includes('btw') &&
            !lowerText.includes('totaal') &&
            !lowerText.includes('iban') &&
            !lowerText.includes('betaal')
          ) {
            parsed.line_items[parsed.line_items.length - 1].item += ' ' + textChunk;
          }
        }
      }
    }
  });

  // Filter line items based on whether they match the Allowed list
  if (allowedItems && allowedItems.length > 0) {
    parsed.line_items = parsed.line_items.filter((li) => {
      const descLower = li.item.toLowerCase();
      // Only Keep items if they partially match one of the explicit allowed list strings
      return allowedItems.some((allowedStr) => {
        const check = allowedStr.trim().toLowerCase();
        return check.length > 0 && descLower.includes(check);
      });
    });

    // If after filtering we have no items left, the invoice is irrelevant
    if (parsed.line_items.length === 0) {
      parsed.is_relevant = false;
    }
  }

  // Calculate totals for UI columns based on discovered line items
  parsed.stands_count = 0;
  parsed.meals_count = 0;

  parsed.line_items.forEach((li) => {
    const desc = li.item.toLowerCase();

    if (desc.includes('stand') || desc.includes('kraam')) {
      if (desc.includes('6x12') || desc.includes('6 x 12') || desc.includes('dubbele')) {
        parsed.stands_count += 2 * li.quantity;
      } else {
        parsed.stands_count += 1 * li.quantity;
      }
    }

    if (
      desc.includes('maaltijd') ||
      desc.includes('meal') ||
      desc.includes('lunch') ||
      desc.includes('bbq') ||
      desc.includes('ontbijt')
    ) {
      parsed.meals_count += li.quantity;
    }
  });

  // Failsafe: if the document didn't have 'omschrijving' header but did mention stands anywhere
  if (parsed.line_items.length === 0 && (!allowedItems || allowedItems.length === 0)) {
    const backupHits = items.filter(
      (i) => i.str.toLowerCase().includes('standhuur') || i.str.toLowerCase().includes('kraam'),
    );
    backupHits.forEach((st) => {
      parsed.line_items.push({ item: st.str, quantity: 1, price: '?' });
      parsed.stands_count += 1;
    });
  }

  // Clean up client block
  if (parsed.client_details.length > 0) {
    parsed.client_details = parsed.client_details.filter((l) => l.length > 3);
  }

  return parsed;
}
