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
        sheets: {},
        lastAdded: null,
        addWorksheet(name) {
          // create a sheet object with helpers for getRow/getCell
          const ws = {
            name,
            columns: null,
            rows: [],
            views: null,
            _cells: {},
            rowCount: 0,
            addRows(r) {
              this.rows.push(...r)
              this.rowCount = this.rows.length + 1
            },
            getRow(rowNumber) {
              return {
                getCell: (colNumber) => {
                  const key = `${rowNumber}:${colNumber}`
                  if (!ws._cells[key]) ws._cells[key] = { value: undefined, protection: {}, dataValidation: undefined }
                  return ws._cells[key]
                }
              }
            },
            getCell(cellRef) {
              // Very lightweight cell setter for metadata sheet (A1)
              if (!ws._cells[cellRef]) ws._cells[cellRef] = { value: undefined }
              return ws._cells[cellRef]
            },
            protect(password, opts) { this._protected = { password, opts } }
          }
          captured.sheets[name] = ws
          captured.lastAdded = ws
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
    // ensure the data sheet contains expected rows
    expect(captured.sheets['Data'].rows).toEqual(expectedRows)
    // freeze view set
    expect(captured.sheets['Data'].views).toEqual([{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }])
    // column widths calculated based on header & content
    expect(captured.sheets['Data'].columns).toBeTruthy()
    // "ID" header -> max length of header (2) vs values (1) -> width = max(2+2, 10) -> 10
    // "Company Name" header (12) vs values (Alice=5,Bob=3) -> width = 12+2 = 14
    expect(captured.sheets['Data'].columns[0].width).toBe(10)
    expect(captured.sheets['Data'].columns[1].width).toBe(14)

    // sheet should have been protected
    expect(captured.sheets['Data']._protected).toBeTruthy()

    // verify protection: header row locked
    const headerCell = captured.sheets['Data'].getRow(1).getCell(1)
    expect(headerCell.protection.locked).toBe(true)
    const headerCell2 = captured.sheets['Data'].getRow(1).getCell(2)
    expect(headerCell2.protection.locked).toBe(true)

    // first data row column 1 (IDs) locked, column 2 unlocked
    const dataCellId = captured.sheets['Data'].getRow(2).getCell(1)
    expect(dataCellId.protection.locked).toBe(true)
    const dataCellOther = captured.sheets['Data'].getRow(2).getCell(2)
    expect(dataCellOther.protection.locked).toBe(false)

    // restore original
    // metadata sheet should exist and contain JSON in A1
    const metaSheet = captured.sheets['__export_metadata']
    expect(metaSheet).toBeTruthy()
    const raw = metaSheet.getCell('A1').value
    const parsed = JSON.parse(raw)
    expect(Array.isArray(parsed.columns)).toBe(true)
    // metadata should include 'columns' mapping; optional metadata fields may
    // be provided by the caller (category_source / category_slugs) but are not
    // required for the core exportToExcel helper.
    expect(parsed.columns).toBeTruthy()

    ExcelJS.Workbook.mockRestore()
  })

  test('locks first N columns when freezeColumns option provided', async () => {
    let captured = null
    jest.spyOn(ExcelJS, 'Workbook').mockImplementation(function Workbook() {
      captured = {
        sheets: {},
        lastAdded: null,
        addWorksheet(name) {
          const ws = {
            name,
            columns: null,
            rows: [],
            views: null,
            _cells: {},
            rowCount: 0,
            addRows(r) { this.rows.push(...r); this.rowCount = this.rows.length + 1 },
            getRow(rowNumber) {
              return {
                getCell: (colNumber) => {
                  const key = `${rowNumber}:${colNumber}`
                  if (!ws._cells[key]) ws._cells[key] = { value: undefined, protection: {}, dataValidation: undefined }
                  return ws._cells[key]
                }
              }
            },
            getCell(cellRef) { if (!ws._cells[cellRef]) ws._cells[cellRef] = { value: undefined }; return ws._cells[cellRef] },
            protect(password, opts) { this._protected = { password, opts } }
          }
          captured.sheets[name] = ws
          captured.lastAdded = ws
          return ws
        },
        xlsx: { async writeBuffer() { return new ArrayBuffer(8) } }
      }
      return captured
    })

    global.URL = Object.assign(global.URL || {}, { createObjectURL: jest.fn().mockReturnValue('blob:fake'), revokeObjectURL: jest.fn() })
    jest.spyOn(fileSaver, 'saveAs').mockImplementation(() => true)

    const rows = [{ ID: 1, Name: 'Alice' }, { ID: 2, Name: 'Bob' }]
    const columns = [{ key: 'ID', header: 'ID' }, { key: 'Name', header: 'Company Name' }]

    // ask to freeze first 2 columns
    const result = await dataExport.exportToExcel(rows, columns, 'companies-test', { freezeColumns: 2 })

    expect(result.success).toBe(true)
    // verify protection: header row locked
    const headerCell = captured.sheets['Data'].getRow(1).getCell(1)
    expect(headerCell.protection.locked).toBe(true)
    const headerCell2 = captured.sheets['Data'].getRow(1).getCell(2)
    expect(headerCell2.protection.locked).toBe(true)

    // first data row column 1 (IDs) locked, column 2 also locked because freezeColumns=2
    const dataCellId = captured.sheets['Data'].getRow(2).getCell(1)
    expect(dataCellId.protection.locked).toBe(true)
    const dataCellOther = captured.sheets['Data'].getRow(2).getCell(2)
    expect(dataCellOther.protection.locked).toBe(true)

    ExcelJS.Workbook.mockRestore()
  })

  test('applies dataValidation for boolean/category columns', async () => {
    let captured = null
    jest.spyOn(ExcelJS, 'Workbook').mockImplementation(function Workbook() {
      captured = {
        sheets: {},
        lastAdded: null,
        addWorksheet(name) {
          const ws = {
            name,
            columns: null,
            rows: [],
            views: null,
            _cells: {},
            rowCount: 0,
            addRows(r) { this.rows.push(...r); this.rowCount = this.rows.length + 1 },
            getRow(rowNumber) {
              return {
                getCell: (colNumber) => {
                  const key = `${rowNumber}:${colNumber}`
                  if (!ws._cells[key]) ws._cells[key] = { value: undefined, protection: {}, dataValidation: undefined }
                  return ws._cells[key]
                }
              }
            },
            getCell(cellRef) { if (!ws._cells[cellRef]) ws._cells[cellRef] = { value: undefined }; return ws._cells[cellRef] },
            protect(password, opts) { this._protected = { password, opts } }
          }
          captured.sheets[name] = ws
          captured.lastAdded = ws
          return ws
        },
        xlsx: { async writeBuffer() { return new ArrayBuffer(8) } }
      }
      return captured
    })

    global.URL = Object.assign(global.URL || {}, { createObjectURL: jest.fn().mockReturnValue('blob:fake'), revokeObjectURL: jest.fn() })
    jest.spyOn(fileSaver, 'saveAs').mockImplementation(() => true)

    // header doesn't include word 'category' but the original key is category:cat1
    const rows = [{ ID: 1, Name: 'Alice', 'category:cat1': '+' }, { ID: 2, Name: 'Bob', 'category:cat1': '-' }]
    const columns = [{ key: 'ID', header: 'ID' }, { key: 'Name', header: 'Company Name' }, { key: 'category:cat1', header: 'Food', type: 'boolean' }]

    const result = await dataExport.exportToExcel(rows, columns, 'companies-test')

    expect(result.success).toBe(true)
    // dataValidation should be applied on row cells for the boolean column (col index 3) even though header doesn't include 'category'
    // check row 2 col 3 and row 3 col 3 (1-based indexes)
    const cellA = captured.sheets['Data'].getRow(2).getCell(3)
    const cellB = captured.sheets['Data'].getRow(3).getCell(3)
    expect(cellA.dataValidation).toBeTruthy()
    expect(cellB.dataValidation).toBeTruthy()
    // dataValidation should be strict (errorStyle stop) to prevent arbitrary text
    expect(cellA.dataValidation.errorStyle).toBe('stop')
    expect(cellB.dataValidation.errorStyle).toBe('stop')
    // category cells should be center-aligned
    expect(cellA.alignment).toBeTruthy()
    expect(cellA.alignment.horizontal).toBe('center')

    ExcelJS.Workbook.mockRestore()
  })
})
