import ExcelJS from 'exceljs'
import * as dataExport from '../utils/dataExportImport'
import * as fileSaver from 'file-saver'

describe('dataExportImport.exportToExcel (ExcelJS)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()
  })

  test('writes freeze view and triggers saveAs', async () => {
    // Mock ExcelJS.Workbook implementation to inspect worksheet created
    let captured = null
    const originalWorkbook = ExcelJS.Workbook
    jest.spyOn(ExcelJS, 'Workbook').mockImplementation(function Workbook() {
      captured = {
        _sheet: null,
        addWorksheet(name) {
          const ws = {
            name,
            columns: null,
            rows: [],
            views: null,
            _cells: {},
            rowCount: 0,
            addRows(r) {
              this.rows.push(...r)
              // header row + data rows
              this.rowCount = this.rows.length + 1
            },
            getRow(rowNumber) {
              // return lightweight row that supports getCell
              return {
                getCell: (colNumber) => {
                  const key = `${rowNumber}:${colNumber}`
                  if (!ws._cells[key]) ws._cells[key] = { value: undefined, protection: {} }
                  return ws._cells[key]
                }
              }
            },
            protect(password, opts) { this._protected = { password, opts } }
          }
          this._sheet = ws
          return ws
        },
        xlsx: { async writeBuffer() { return new ArrayBuffer(8) } }
      }
      return captured
    })

    // Provide global URL.createObjectURL + revoke mocks used by file-saver
    global.URL = Object.assign(global.URL || {}, { createObjectURL: jest.fn().mockReturnValue('blob:fake'), revokeObjectURL: jest.fn() })
    const saveSpy = jest.spyOn(fileSaver, 'saveAs').mockImplementation(() => true)

    const rows = [{ ID: 1, Name: 'Alice' }, { ID: 2, Name: 'Bob' }]
    const columns = [{ key: 'ID', header: 'ID' }, { key: 'Name', header: 'Company Name' }]

    const result = await dataExport.exportToExcel(rows, columns, 'companies-test')

    expect(result.success).toBe(true)
    expect(captured).toBeTruthy()
    // exported rows added
    // rows are transformed to export format (headers used as keys, values stringified)
    const expectedRows = rows.map(r => ({ ID: String(r.ID), 'Company Name': String(r.Name) }))
    expect(captured._sheet.rows).toEqual(expectedRows)
    // freeze view set
    expect(captured._sheet.views).toEqual([{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }])
    // column widths calculated based on header & content
    expect(captured._sheet.columns).toBeTruthy()
    // "ID" header -> max length of header (2) vs values (1) -> width = max(2+2, 10) -> 10
    // "Company Name" header (12) vs values (Alice=5,Bob=3) -> width = 12+2 = 14
    expect(captured._sheet.columns[0].width).toBe(10)
    expect(captured._sheet.columns[1].width).toBe(14)

    // sheet should have been protected
    expect(captured._sheet._protected).toBeTruthy()

    // verify protection: header row locked
    const headerCell = captured._sheet.getRow(1).getCell(1)
    expect(headerCell.protection.locked).toBe(true)
    const headerCell2 = captured._sheet.getRow(1).getCell(2)
    expect(headerCell2.protection.locked).toBe(true)

    // first data row column 1 (IDs) locked, column 2 unlocked
    const dataCellId = captured._sheet.getRow(2).getCell(1)
    expect(dataCellId.protection.locked).toBe(true)
    const dataCellOther = captured._sheet.getRow(2).getCell(2)
    expect(dataCellOther.protection.locked).toBe(false)

    // restore original
    ExcelJS.Workbook.mockRestore()
  })
})
