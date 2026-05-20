// Minimal mock of xlsx for unit tests
const TextEncoder = global.TextEncoder || require('util').TextEncoder;
const TextDecoder = global.TextDecoder || require('util').TextDecoder;

const utils = {
  json_to_sheet(rows) {
    return { __rows: rows };
  },
  book_new() {
    return { Sheets: {}, SheetNames: [] };
  },
  book_append_sheet(wb, ws, name) {
    wb.Sheets[name] = ws;
    wb.SheetNames.push(name);
  },
  // Convert an array-of-arrays to a sheet with A1-style cell objects
  aoa_to_sheet(aoa) {
    // Helper to convert 1-based column index to Excel letter (A, B, ..., Z, AA, AB...)
    function colLetter(n) {
      let s = '';
      while (n > 0) {
        const mod = (n - 1) % 26;
        s = String.fromCharCode(65 + mod) + s;
        n = Math.floor((n - mod) / 26);
      }
      return s;
    }

    const sheet = {};
    for (let r = 0; r < aoa.length; r++) {
      const row = aoa[r] || [];
      for (let c = 0; c < row.length; c++) {
        const addr = `${colLetter(c + 1)}${r + 1}`;
        sheet[addr] = { v: row[c] };
      }
    }
    const maxCols = aoa.reduce((m, row) => Math.max(m, (row || []).length), 0);
    const maxRows = aoa.length;
    if (maxCols > 0 && maxRows > 0) {
      sheet['!ref'] = `A1:${colLetter(maxCols)}${maxRows}`;
    } else {
      sheet['!ref'] = 'A1:A1';
    }
    return sheet;
  },
  sheet_to_json(worksheet, opts) {
    return worksheet && worksheet.__rows ? worksheet.__rows : [];
  },
};

function read(data, opts) {
  // Accept ArrayBuffer/Uint8Array or string produced by write
  let bytes;
  if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
  else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer || data);
  else bytes = data;

  try {
    const str = new TextDecoder().decode(bytes);
    return JSON.parse(str);
  } catch (e) {
    // fallback: return an empty workbook
    return { Sheets: {}, SheetNames: [] };
  }
}

function write(wb, opts) {
  const json = JSON.stringify(wb);
  const encoder = new TextEncoder();
  return encoder.encode(json);
}

module.exports = {
  read,
  write,
  utils,
};
