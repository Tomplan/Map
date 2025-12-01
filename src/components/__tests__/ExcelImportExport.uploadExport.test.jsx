import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExcelImportExport from '../ExcelImportExport'
import * as XLSX from 'xlsx'

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
    fireEvent.click(exportBtn)

    expect(createSpy).toHaveBeenCalled()
    if (createSpy.mockRestore) createSpy.mockRestore()
  })
})
