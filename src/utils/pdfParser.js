// pdfjs-dist is heavy and uses CommonJS; importing at top-level trips Vite's
// import-analysis when bundling the frontend.  Load it dynamically inside the
// parser so the module only gets evaluated at runtime (and the build process
// can skip it).

export async function parsePdfInvoice(file, allowedItems = []) {
  // import legacy build for browser compatibility
  // pdfjs-dist exports differently depending on environment/packager.  In ESM imports
  // we often get a namespace with a `default` that contains the real API. Normalize once.
  const raw = await import('pdfjs-dist/legacy/build/pdf.js');
  const pdfjsLib = raw.default || raw;
  // Standard worker pattern. Hardcoded version to match package.json to prevent Vite export undefined issues.
  // In Node.js the GlobalWorkerOptions object may not exist, so guard the assignment.
  if (pdfjsLib.GlobalWorkerOptions) {
    if (typeof window !== 'undefined') {
      // browser path
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    } else {
      // running under Node; don't try to load remote worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // pdfjs tries to load a worker script which fails in Node; disable when no window.
      disableWorker: typeof window === 'undefined',
    });
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

// export helper for tests
export { parseSpatialInvoice };

function parseSpatialInvoice(items, allowedItems) {
  // Sort items top-to-bottom. Y is higher for the top of the page.
  // use a tighter threshold so closely‑spaced rows aren’t merged accidentally.
  const LINE_GAP = 4; // points
  items.sort((a, b) => {
    // Treat items within LINE_GAP points of Y as being on the same line
    if (Math.abs(b.y - a.y) < LINE_GAP) {
      return a.x - b.x; // sort left-to-right
    }
    return b.y - a.y; // sort top-to-bottom
  });

  // track whether we've begun collecting notes lines
  let notesStarted = false;
  let noteColumnX = null; // left boundary of the notes column, determined from header

  const parsed = {
    invoice_number: null,
    invoice_date: null,
    company_name: null,
    client_details: [],
    line_items: [],
    opmerkingen: '',
    notes: '', // extracted from opmerkingen block
    is_relevant: true,
    // breakdowns added recently
    breakfast: 0,
    lunch: 0,
    bbq: 0,
  };

  const lines = [];
  let currentY = null;
  let currentLine = [];

  // Group into lines
  items.forEach((item) => {
    if (item.str.trim() === '') return;

    if (currentY === null || Math.abs(currentY - item.y) >= LINE_GAP) {
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
    // We start collecting once we hit a line containing "opmerking(s)" or "betreft".
    if (
      !notesStarted &&
      (lowerText.includes('opmerking') || lowerText.includes('opmerkingen') || lowerText.includes('betreft'))
    ) {
        // ignore the header row that lists both column names like
      // "Betaalmethode  Opmerking"; the real notes start on the next line.
      if (lowerText.includes('betaalmethode')) {
        // record boundary for the notes column based on position of "Opmerking"
        const opItem = lineItems.find((i) => /opmerking/i.test(i.str));
        if (opItem) {
          noteColumnX = opItem.x;
          console.debug('HEADER SKIP: recorded noteColumnX', noteColumnX);
        }
        console.debug('HEADER SKIP: setting notesStarted, ignoring line', textChunk);
        notesStarted = true;
        return; // skip to next line in the forEach
      }
      notesStarted = true;
      // determine keyword match so we can slice after it
      const kwMatch = textChunk.match(/(opmerking(?:en)?|betreft)/i);
      let noteStart = '';
      if (kwMatch) {
        const idx = lowerText.indexOf(kwMatch[1].toLowerCase());
        noteStart = textChunk.slice(idx + kwMatch[1].length).trim();
        // strip leading colon/space
        noteStart = noteStart.replace(/^[:\s]+/, '').trim();
      }
      if (!noteStart) {
        // fallback: take the entire line if we couldn't slice properly
        noteStart = textChunk.trim();
      }
      console.debug('NOTE start:', noteStart);
      parsed.notes = noteStart;
      // maintain legacy field too
      parsed.opmerkingen = parsed.notes;
    } else if (
      notesStarted &&
      !/(totaal|totale|btw|iban)/.test(lowerText) &&
      !inLineItems &&
      // ignore lines that appear to be bank/IBAN numbers or other purely numeric metadata
      !/^\s*\d{2,}\s+[A-Z]{2}\d+/.test(textChunk)
    ) {
      // Continue capturing notes if we previously started and not past the notes section
      // if we know the notes column boundary, filter items accordingly
      let appendText = textChunk;
      if (noteColumnX !== null) {
        const rightSide = lineItems
          .filter((i) => i.x >= noteColumnX - 2)
          .map((i) => i.str)
          .join(' ')
          .trim();
        if (rightSide) {
          appendText = rightSide;
        } else {
          console.debug('skipping left-column-only line', textChunk);
          appendText = '';
        }
      }
      if (appendText) {
        console.debug('NOTE append:', appendText);
        parsed.notes += (parsed.notes ? ' ' : '') + appendText;
        parsed.opmerkingen = parsed.notes;
      }
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
      // maintain legacy total count for compatibility
      parsed.meals_count += li.quantity;
    }

    // break the meals out by type so sync logic can create sensible
    // subscriptions.  By default we treat everything as Saturday; the
    // InvoiceSyncTab will split lunches half/half and leave sunday counts
    // at zero unless overwritten manually.
    if (desc.includes('ontbijt') || desc.includes('breakfast')) {
      parsed.breakfast += li.quantity;
    }
    if (desc.includes('lunch')) {
      parsed.lunch += li.quantity;
    }
    if (desc.includes('bbq') || desc.includes('barbecue')) {
      parsed.bbq += li.quantity;
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
