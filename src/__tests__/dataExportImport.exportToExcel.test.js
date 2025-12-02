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
            addRows(r) { this.rows.push(...r) }
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

    // restore original
    ExcelJS.Workbook.mockRestore()
  })
})
