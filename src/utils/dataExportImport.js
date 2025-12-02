import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs'

/**
 * Core utilities for data export/import
 * Browser-based implementation using xlsx and file-saver
 */

// ==================== EXPORT FUNCTIONS ====================

/**
 * Export data to Excel (.xlsx) format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration: [{ key, header, type }]
 * @param {string} filename - Output filename (without extension)
 * @returns {Promise<void>}
 */
export async function exportToExcel(data, columns, filename) {
  try {
    // Transform data to match column headers
    const exportData = data.map(row => {
      const transformed = {};
      columns.forEach(col => {
        const value = row[col.key];
        transformed[col.header] = formatValueForExport(value, col.type);
      });
      return transformed;
    });

    // Use ExcelJS to create the workbook so freeze panes are written
    // reliably (xlsx library does not write <pane/> reliably).
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Data')

    // Set header columns then add rows
    const cols = columns.map((c) => ({ header: c.header, key: c.header }))
    if (cols.length) sheet.columns = cols
    sheet.addRows(exportData)

    // Calculate and set column widths so the widest cell is visible
    // For each column: find the max length among the header and every cell in that column
    // Add a small padding (2 chars) and apply a min/max to avoid extremely small or large columns
    const MIN_COL_WIDTH = 10
    const MAX_COL_WIDTH = 60

    const computedWidths = columns.map((col) => {
      const headerText = String(col.header || '')
      let maxLen = headerText.length
      for (const row of exportData) {
        const cell = row[col.header]
        const text = cell === null || cell === undefined ? '' : String(cell)
        if (text.length > maxLen) maxLen = text.length
      }
      const width = Math.min(Math.max(maxLen + 2, MIN_COL_WIDTH), MAX_COL_WIDTH)
      return { width }
    })

    // Apply widths to each column object the worksheet holds
    sheet.columns.forEach((c, i) => { if (computedWidths[i]) c.width = computedWidths[i].width })

    // Freeze header row + first column
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }]

    // Protect sheet so headers (first row) and IDs (first column) are locked
    // Approach: Unlock all cells, then lock first row and first column, then protect the sheet
    const totalRows = sheet.rowCount || (exportData.length + 1)
    const totalCols = sheet.columns ? sheet.columns.length : columns.length

    for (let r = 1; r <= totalRows; r++) {
      const row = sheet.getRow(r)
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c)
        // lock header row (row 1) and id column (col 1); other cells unlocked
        if (r === 1 || c === 1) {
          cell.protection = { locked: true }
        } else {
          cell.protection = { locked: false }
        }
      }
    }

    // Enable worksheet protection (no password by default) so locked flags apply
    // Disable formatting/inserting/deleting by default so headers/ids remain read-only
    await sheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatRows: false,
      formatColumns: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
    })

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${filename}.xlsx`)

    return { success: true };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration: [{ key, header, type }]
 * @param {string} filename - Output filename (without extension)
 * @returns {Promise<void>}
 */
export async function exportToCSV(data, columns, filename) {
  try {
    // Transform data to match column headers
    const exportData = data.map(row => {
      const transformed = {};
      columns.forEach(col => {
        const value = row[col.key];
        transformed[col.header] = formatValueForExport(value, col.type);
      });
      return transformed;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);

    return { success: true };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export data to JSON format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 * @returns {Promise<void>}
 */
export async function exportToJSON(data, filename) {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);

    return { success: true };
  } catch (error) {
    console.error('JSON export error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format value for export based on type
 */
function formatValueForExport(value, type) {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : '';
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

// ==================== IMPORT FUNCTIONS ====================

/**
 * Parse Excel file from browser File object
 * @param {File} file - File object from input
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function parseExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '', // Default value for empty cells
          raw: false  // Keep as strings to preserve formatting
        });

        resolve({ data: jsonData, error: null });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        resolve({ data: null, error: error.message });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: 'Failed to read file' });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file from browser File object
 * @param {File} file - File object from input
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function parseCSVFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;

        // Use xlsx library to parse CSV (handles edge cases better)
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        });

        resolve({ data: jsonData, error: null });
      } catch (error) {
        console.error('Error parsing CSV file:', error);
        resolve({ data: null, error: error.message });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}

/**
 * Parse JSON file from browser File object
 * @param {File} file - File object from input
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function parseJSONFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        if (!Array.isArray(jsonData)) {
          resolve({ data: null, error: 'JSON must be an array of objects' });
          return;
        }

        resolve({ data: jsonData, error: null });
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        resolve({ data: null, error: 'Invalid JSON format' });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}

/**
 * Detect file type and parse accordingly
 * @param {File} file - File object from input
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    case 'csv':
      return parseCSVFile(file);
    case 'json':
      return parseJSONFile(file);
    default:
      return { data: null, error: `Unsupported file type: .${extension}` };
  }
}

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate email format
 * @param {string} email
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: true, value: null, error: null };
  }

  const cleaned = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleaned)) {
    return {
      valid: false,
      value: null,
      error: `Invalid email format: "${email}"`
    };
  }

  return { valid: true, value: cleaned, error: null };
}

/**
 * Validate phone format using normalizePhone utility
 * @param {string} phone
 * @param {function} normalizePhone - Phone normalization function
 * @returns {{valid: boolean, value: string|null, error: string|null}}
 */
export function validatePhone(phone, normalizePhone) {
  if (!phone || phone.trim() === '') {
    return { valid: true, value: null, error: null };
  }

  const normalized = normalizePhone(phone);

  // If normalized equals the input (no normalization occurred), it might be invalid
  // But normalizePhone returns cleaned digits as fallback, so we accept it
  if (!normalized) {
    return {
      valid: false,
      value: null,
      error: `Invalid phone format: "${phone}"`
    };
  }

  return { valid: true, value: normalized, error: null };
}

/**
 * Validate number value
 * @param {any} value
 * @param {{min: number, max: number, default: number}} options
 * @returns {{valid: boolean, value: number, error: string|null}}
 */
export function validateNumber(value, options = {}) {
  const { min, max, default: defaultValue = 0 } = options;

  if (value === null || value === undefined || value === '') {
    return { valid: true, value: defaultValue, error: null };
  }

  const num = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(num)) {
    return {
      valid: false,
      value: null,
      error: `Invalid number: "${value}"`
    };
  }

  if (min !== undefined && num < min) {
    return {
      valid: false,
      value: null,
      error: `Value must be at least ${min}, got ${num}`
    };
  }

  if (max !== undefined && num > max) {
    return {
      valid: false,
      value: null,
      error: `Value must be at most ${max}, got ${num}`
    };
  }

  return { valid: true, value: num, error: null };
}

/**
 * Validate required field
 * @param {any} value
 * @param {string} fieldName
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateRequired(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return {
      valid: false,
      error: `${fieldName} is required`
    };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`
    };
  }

  return { valid: true, error: null };
}

// ==================== MATCHING FUNCTIONS ====================

/**
 * Match imported records against existing data
 * @param {Array} importData - Parsed import data
 * @param {Array} existingData - Existing records from database
 * @param {Array<string>} matchFields - Field names to match on
 * @param {boolean} caseSensitive - Whether matching is case-sensitive
 * @returns {{creates: Array, updates: Array, matches: Map}}
 */
export function matchRecords(importData, existingData, matchFields, caseSensitive = false) {
  const creates = [];
  const updates = [];
  const matches = new Map(); // importRow -> existingRow

  importData.forEach(importRow => {
    let found = null;

    // Try to find a match in existing data
    for (const existingRow of existingData) {
      let isMatch = true;

      for (const field of matchFields) {
        const importValue = importRow[field];
        const existingValue = existingRow[field];

        let importCompare = importValue;
        let existingCompare = existingValue;

        if (!caseSensitive) {
          importCompare = String(importValue || '').toLowerCase().trim();
          existingCompare = String(existingValue || '').toLowerCase().trim();
        }

        if (importCompare !== existingCompare) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        found = existingRow;
        break;
      }
    }

    if (found) {
      updates.push(importRow);
      matches.set(importRow, found);
    } else {
      creates.push(importRow);
    }
  });

  return { creates, updates, matches };
}

/**
 * Build a lookup map from array of objects
 * @param {Array} data - Array of objects
 * @param {string} keyField - Field to use as key
 * @param {string} valueField - Field to use as value
 * @param {boolean} caseSensitive - Whether keys are case-sensitive
 * @returns {Object} - Map of key -> value
 */
export function buildLookupMap(data, keyField, valueField, caseSensitive = false) {
  const map = {};

  data.forEach(item => {
    let key = item[keyField];
    if (!caseSensitive && typeof key === 'string') {
      key = key.toLowerCase().trim();
    }
    map[key] = item[valueField];
  });

  return map;
}
