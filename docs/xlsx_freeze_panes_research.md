# XLSX Library Freeze Panes Research & Troubleshooting

## Current Implementation Status
- **Project**: Using `xlsx` library version `0.18.5` ✅ (confirmed installed)
- **Current Syntax**: `worksheet['!freeze'] = { xSplit: 1, ySplit: 1 }`
- **Expected Result**: Freeze first row and first column
- **SheetJS Documentation**: https://docs.sheetjs.com/

## Common Issues with XLSX Freeze Panes

### 1. Library Version Compatibility
**Issue**: Different versions of XLSX handle freeze panes differently
- Older versions may not support `!freeze` property
- Some versions require `!freezePane` instead
- Version 0.18.5 generally supports both approaches

### 2. Browser vs Node.js Differences
**Issue**: Freeze panes may work differently in browser vs Node.js environments
- Browser implementations sometimes ignore freeze pane settings
- Excel applications may not respect all XLSX freeze settings

### 3. Application Support
**Issue**: Not all spreadsheet applications support XLSX freeze panes equally
- **Microsoft Excel**: Generally good support
- **Google Sheets**: May have limited support for programmatic freeze panes
- **LibreOffice**: Variable support
- **Apple Numbers**: Limited XLSX freeze pane support

## Recommended Troubleshooting Steps

### Step 1: Verify XLSX Version
```bash
npm list xlsx
```
Check if version 0.18.5 is installed or if a different version was installed.

### Step 2: Test Alternative Syntax
Try different freeze pane approaches:

```javascript
// Method 1: !freeze (current implementation)
worksheet['!freeze'] = { xSplit: 1, ySplit: 1 };

// Method 2: !freezePane with object
worksheet['!freezePane'] = { xSplit: 1, ySplit: 1 };

// Method 3: !freezePane with cell reference
worksheet['!freezePane'] = 'B2';

// Method 4: Multiple properties
worksheet['!cols'] = colWidths;
worksheet['!rows'] = [{ hpt: 20 }]; // Set row height
worksheet['!freeze'] = { xSplit: 1, ySplit: 1 };
```

### Step 3: Test in Different Applications
1. Open exported file in Microsoft Excel (best compatibility)
2. Test in Google Sheets
3. Try LibreOffice Calc

### Step 4: Add Debugging
```javascript
// Add console.log to verify property is set
console.log('Freeze panes before write:', worksheet['!freeze']);
const excelBuffer = XLSX.write(workbook, {
  bookType: 'xlsx',
  type: 'array'
});
console.log('Workbook created with freeze panes');
```

### Step 5: Check File Structure
Verify the worksheet structure includes required properties:
```javascript
console.log('Worksheet properties:', Object.keys(worksheet).filter(key => key.startsWith('!')));
```

### Step 6: Browser Cache & Application Testing
1. **Hard refresh browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache** for the application
3. **Test in incognito/private mode**
4. **Try different browsers** (Chrome, Firefox, Safari)

### Step 7: Verify File Contents
Use a tool like **ExcelJS Viewer** or **LibreOffice** to inspect the raw XLSX structure:
- Check if `xl/worksheets/sheet1.xml` contains freeze pane elements
- Look for `<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>`

## Version-Specific Notes for XLSX 0.18.5

### Supported Freeze Pane Properties:
- `worksheet['!freeze']` - Object format (RECOMMENDED)
- `worksheet['!freezePane']` - String or object format
- `worksheet['!protect']` - May conflict with freeze panes

### Known Issues in v0.18.5:
1. **Browser environment**: Some freeze settings may be ignored
2. **Google Sheets**: Partial support for programmatic freeze panes
3. **File size**: Freeze panes add minimal overhead

### Alternative Approaches if Freeze Panes Fail:
1. **Use Excel templates** with pre-configured freeze panes
2. **Manual freeze instructions** in export documentation
3. **Use CSV format** (no freeze pane support but universal compatibility)
4. **Consider newer library** like ExcelJS for better freeze pane support

## Recommended Testing Protocol

1. **Generate test file** with current implementation
2. **Test in Microsoft Excel** (gold standard for XLSX support)
3. **Test in Google Sheets** (web-based, common use case)
4. **Test in LibreOffice** (open source alternative)
5. **Document results** and adjust approach accordingly

## CRITICAL DISCOVERY: XLSX v0.18.5 Freeze Pane Bug

### Root Cause Identified ✅
**XLSX library version 0.18.5 has a BUG with freeze pane implementation**

### Evidence from File Inspection
- **JavaScript properties SET**: `worksheet['!freeze'] = { xSplit: 1, ySplit: 1 }` ✅
- **XLSX file XML generated**: `<sheetViews><sheetView workbookViewId="0"/></sheetViews>` ❌
- **Missing pane elements**: No `<pane xSplit="1" ySplit="1".../>` in XML ❌

### Tested Approaches (All Failed)
1. `worksheet['!freeze'] = { xSplit: 1, ySplit: 1 }`
2. `worksheet['!freezePane'] = { xSplit: 1, ySplit: 1 }`
3. `worksheet['!freezePane'] = 'B2'`
4. `worksheet['!views'] = [{ xSplit: 1, ySplit: 1 }]`
5. Various write options and sheet creation methods

**Result**: ALL methods produce identical broken XML without pane elements.

### XLSX Version Analysis
- **Current version**: 0.18.5 (latest available)
- **Library accepts properties** but **doesn't write them to XML**
- This is a confirmed bug in the library itself

## SOLUTIONS

### Option 1: Library Downgrade (NOT RECOMMENDED)
- Roll back to older XLSX version (pre-0.17)
- Risk breaking other functionality
- May have security vulnerabilities

### Option 2: Switch to ExcelJS Library (RECOMMENDED)
```bash
npm install exceljs
npm uninstall xlsx
```
- ExcelJS has better freeze pane support
- More comprehensive Excel feature set
- Better maintained for complex Excel operations

### Implementation note (project)
The project now uses ExcelJS for creating exports that require freeze panes. Implementation details:

- Export still accepts uploads via the `xlsx` library (good for parsing but lacks reliable freeze-pane output).
- For exports we now construct the workbook via ExcelJS and set:
  worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }]

This ensures a genuine <pane/> element is written into the worksheet XML and Excel properly shows frozen panes for the top row and first column. Tests were added to mock ExcelJS and assert the worksheet rows and views are set correctly.

---

## CI Guard + Tests for Supabase runtime configuration

To prevent regressions where runtime environment variables (Vite -> import.meta.env or define globals) are no longer surfaced to the app, the project includes a small unit test that verifies `src/supabaseClient.js` detects environment values from three sources, in priority order:

- `globalThis.__SUPABASE_CONFIG__` — the runtime bridge set by `src/main.jsx` (preferred)
- `__VITE_SUPABASE_URL__` / `__VITE_SUPABASE_ANON_KEY__` — define() injected tokens available when Vite builds/preview is used
- `process.env` — Node/test fallback used in CI/tests

This test helps prevent future commits from accidentally removing the runtime bridge or the define tokens that would break admin login during dev/preview.

### Option 3: Post-Processing Fix
- Add freeze panes after XLSX file creation
- Use a separate tool to modify the XLSX XML
- Complex and error-prone

### Option 4: Manual Instructions
- Keep current implementation
- Add user instructions for manually freezing panes
- Provide documentation on how to freeze panes in Excel

### Option 5: Alternative Format
- Export as CSV (universal compatibility)
- Add freeze pane instructions to CSV import guides