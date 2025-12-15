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
