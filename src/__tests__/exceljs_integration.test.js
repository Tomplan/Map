import ExcelJS from 'exceljs';
import JSZip from 'jszip';

describe('ExcelJS integration: freeze pane in generated XML', () => {
  test('writes <pane/> element into xl/worksheets/sheet1.xml when worksheet.views set', async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Sheet1');

    // Create header and a couple rows
    ws.columns = [
      { header: 'A', key: 'A' },
      { header: 'B', key: 'B' },
    ];
    ws.addRows([
      { A: 1, B: 2 },
      { A: 3, B: 4 },
    ]);

    // Freeze header row and first column
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }];

    // generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // unzip and inspect sheet XML
    const zip = await JSZip.loadAsync(buffer);
    const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

    // assert pane element is present
    expect(sheetXml).toMatch(/<pane\b/);
  });
});
