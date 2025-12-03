import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExcelImportExport from '../ExcelImportExport'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

describe('ExcelImportExport integration', () => {
  test('uploads an xlsx file and shows preview, then exports', async () => {
    render(<ExcelImportExport />)

    // Create sample workbook in memory
    const rows = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    // produce an ArrayBuffer/Uint8Array
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

    // create a File from the workbook output
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const file = new File([blob], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    // jsdom's File may not implement arrayBuffer in this environment; add a helper
    if (!file.arrayBuffer) {
      // wbout may be a Uint8Array; prefer .buffer if available
      const payload = wbout && wbout.buffer ? wbout.buffer : wbout
      file.arrayBuffer = async () => payload
    }

    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    // Preview should render the first rows
    const preview = await screen.findByTestId('preview')
    await waitFor(() => expect(preview).toHaveTextContent('Alice'))
    expect(preview).toHaveTextContent('Bob')

    // Spy on createObjectURL during export
    // ensure URL.createObjectURL is available in this test env
    let createSpy
    if (typeof URL === 'undefined' || !URL.createObjectURL) {
      createSpy = jest.fn().mockReturnValue('blob:fake')
      global.URL = Object.assign({}, global.URL, { createObjectURL: createSpy, revokeObjectURL: jest.fn() })
    } else {
      createSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    }

      const exportBtn = screen.getByTestId('export-btn')
      // Ensure there are rows in state so export is active
      // Prevent jsdom navigation on anchor click
      const origClick = HTMLAnchorElement.prototype.click
      HTMLAnchorElement.prototype.click = jest.fn()

      fireEvent.click(exportBtn)

      // ExcelJS export is async – wait for createObjectURL to be called
      await waitFor(() => expect(createSpy).toHaveBeenCalled())

      // restore prototypes/mocks
      HTMLAnchorElement.prototype.click = origClick
      if (createSpy.mockRestore) createSpy.mockRestore()
    })

    test('exported file contains same rows as uploaded workbook', async () => {
      render(<ExcelImportExport />)

      const rows = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const file = new File([blob], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      if (!file.arrayBuffer) {
        const payload = wbout && wbout.buffer ? wbout.buffer : wbout
        file.arrayBuffer = async () => payload
      }

      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })

      // Wait for preview to load
      const preview = await screen.findByTestId('preview')
      await waitFor(() => expect(preview).toHaveTextContent('Alice'))

      // Replace ExcelJS.Workbook with a lightweight mock so we can inspect
      // the worksheet that gets created and ensure rows and views are set.
      const originalWorkbook = ExcelJS.Workbook
      let capturedWorkbook = null
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(function Workbook() {
        capturedWorkbook = {
          _sheet: null,
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
                return { getCell: (colNumber) => {
                  const key = `${rowNumber}:${colNumber}`
                  if (!ws._cells[key]) ws._cells[key] = { value: undefined, protection: {} }
                  return ws._cells[key]
                } }
              },
              protect(password, opts) { this._protected = { password, opts } }
            }
            this._sheet = ws
            return ws
          },
          xlsx: {
            async writeBuffer() { return new ArrayBuffer(8) }
          }
        }
        return capturedWorkbook
      })

      // Trigger export
      const exportBtn = screen.getByTestId('export-btn')
      fireEvent.click(exportBtn)

      // Ensure the mocked workbook was used and rows were written
      expect(capturedWorkbook).toBeTruthy()
      expect(capturedWorkbook._sheet.rows).toEqual(rows)
      // Freeze panes were requested as a view
      expect(capturedWorkbook._sheet.views).toEqual([{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }])
      // Column widths should be computed so that the widest cell is visible
      expect(capturedWorkbook._sheet.columns).toBeTruthy()
      // 'name' column has header length 4, values up to 5 -> width = max(5+2,10) = 10
      // 'age' column header length 3 -> width = max(3+2,10) = 10
      expect(capturedWorkbook._sheet.columns[0].width).toBe(10)
      expect(capturedWorkbook._sheet.columns[1].width).toBe(10)

      // sheet should have been protected and header/first-col cells locked
      expect(capturedWorkbook._sheet._protected).toBeTruthy()
      // header row locked
      expect(capturedWorkbook._sheet.getRow(1).getCell(1).protection.locked).toBe(true)
      expect(capturedWorkbook._sheet.getRow(1).getCell(2).protection.locked).toBe(true)
      // first column locked in data rows, other cells unlocked
      expect(capturedWorkbook._sheet.getRow(2).getCell(1).protection.locked).toBe(true)
      expect(capturedWorkbook._sheet.getRow(2).getCell(2).protection.locked).toBe(false)

      // restore ExcelJS.Workbook
      ExcelJS.Workbook.mockRestore()
    })
})
