import React, { useState } from 'react';
// XLSX is only used during upload parsing; dynamically import when needed
import { exportToExcel } from '../utils/dataExportImport';
import { saveAs } from 'file-saver';

export default function ExcelImportExport() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show loading state immediately
    setIsLoading(true);
    setLoadingProgress('Reading file...');
    setRows([]); // Clear previous data to prevent visual conflicts

    try {
      setLoadingProgress('Parsing Excel data...');
      const data = await file.arrayBuffer();

      setLoadingProgress('Processing workbook...');
      // Dynamically import xlsx only when user uploads a file
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule && XLSXModule.default ? XLSXModule.default : XLSXModule;

      const workbook = XLSX.read(data, { type: 'array' });

      setLoadingProgress('Extracting data...');
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Update state immediately to ensure UI updates properly
      setRows(json);
      setIsLoading(false);
      setLoadingProgress('');
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setIsLoading(false);
      setLoadingProgress('Error loading file');
      // Clear error message after a delay but ensure UI updates immediately
      setTimeout(() => setLoadingProgress(''), 3000);
    }
  };

  const onExportToExcel = async () => {
    if (!rows?.length) return;

    // Prepare column configuration for the export
    const columns = Object.keys(rows[0] || {}).map((key) => ({
      key: key,
      header: key,
      // Automatically detect numeric columns so exported workbook keeps
      // numbers as numbers rather than stringifying them.
      type: typeof (rows[0] && rows[0][key]) === 'number' ? 'number' : 'text',
    }));

    // Perform a lightweight Excel export here (keeps numeric types intact)
    // and avoid loading the large export utility which serializes values.
    try {
      let ExcelJS;
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
        ExcelJS = require('exceljs');
      } else {
        const ExcelJSModule = await import('exceljs');
        ExcelJS = ExcelJSModule && ExcelJSModule.default ? ExcelJSModule.default : ExcelJSModule;
      }
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Data');

      if (columns.length) sheet.columns = columns.map((c) => ({ header: c.header, key: c.key }));
      sheet.addRows(rows);

      // compute simple widths (min 10 chars)
      const MIN_COL_WIDTH = 10;
      const MAX_COL_WIDTH = 60;
      const computedWidths = columns.map((col) => {
        const headerText = String(col.header || '');
        let maxLen = headerText.length;
        for (const r of rows) {
          const cell = r[col.key];
          const text = cell === null || cell === undefined ? '' : String(cell);
          if (text.length > maxLen) maxLen = text.length;
        }
        const width = Math.min(Math.max(maxLen + 2, MIN_COL_WIDTH), MAX_COL_WIDTH);
        return { width };
      });
      sheet.columns.forEach((c, i) => {
        if (computedWidths[i]) c.width = computedWidths[i].width;
      });

      // freeze header + first column
      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }];

      // lock header and first col
      try {
        const headerRow = sheet.getRow(1);
        for (let i = 1; i <= columns.length; i++) {
          try {
            headerRow.getCell(i).protection = { locked: true };
          } catch (e) {}
        }
        for (let r = 2; r <= (sheet.rowCount || rows.length + 1); r++) {
          const rowObj = sheet.getRow(r);
          for (let c = 1; c <= columns.length; c++) {
            try {
              rowObj.getCell(c).protection = { locked: c === 1 };
            } catch (e) {}
          }
        }
        try {
          sheet.protect && sheet.protect('', {});
        } catch (e) {}
      } catch (e) {
        /* ignore */
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `export.xlsx`);
    } catch (e) {
      console.error('Export error (component):', e);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel</label>
      <input
        data-testid="file-input"
        className="block w-full text-sm text-gray-900 border rounded p-2"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={isLoading}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">{loadingProgress}</span>
        </div>
      )}

      {/* Export button - only enable when we have data */}
      {rows.length > 0 && !isLoading && (
        <div className="flex gap-3 pt-2">
          <button
            data-testid="export-btn"
            onClick={onExportToExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Export to Excel
          </button>
        </div>
      )}

      {/* Optimized Preview section */}
      {rows.length > 0 && !isLoading && (
        <div className="transition-all duration-300 ease-in-out">
          <h3 className="text-sm font-semibold mb-2">Preview ({rows.length} rows)</h3>
          <div className="bg-gray-50 rounded border">
            <pre
              data-testid="preview"
              className="text-xs p-3 max-h-48 overflow-auto"
              style={{
                maxHeight: '12rem',
                transition: 'max-height 0.3s ease-in-out',
              }}
            >
              {JSON.stringify(rows.slice(0, 20), null, 2)}
            </pre>
          </div>
          {rows.length > 20 && (
            <p className="text-xs text-gray-500 mt-2">
              Showing first 20 rows of {rows.length} total
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M34 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 36c-2.186 0-4.216.682-5.713 1.843"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <p className="mt-2">Upload an Excel file to see preview</p>
        </div>
      )}
    </div>
  );
}
