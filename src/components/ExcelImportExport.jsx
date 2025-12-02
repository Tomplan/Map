import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

export default function ExcelImportExport() {
  const [rows, setRows] = useState([])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
    setRows(json)
  }

  const exportToExcel = async () => {
    if (!rows?.length) return

    // Use ExcelJS for exports so freeze panes are written reliably
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Sheet1')

    // Add header row based on keys and write rows
    const cols = Object.keys(rows[0] || {}).map((k) => ({ header: k, key: k }))
    if (cols.length) sheet.columns = cols
    sheet.addRows(rows)

    // Freeze header row + first column (top row and first column)
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }]

    // Generate workbook buffer then download
    const wbout = await workbook.xlsx.writeBuffer()
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4 bg-white rounded shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel</label>
      <input
        data-testid="file-input"
        className="block w-full text-sm text-gray-900 border rounded p-2"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
      />

      <div className="flex gap-3 pt-2">
        <button
          data-testid="export-btn"
          onClick={exportToExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export to Excel
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Preview</h3>
        <pre data-testid="preview" className="text-xs bg-gray-100 p-2 rounded max-h-48 overflow-auto">
          {JSON.stringify(rows.slice(0, 20), null, 2)}
        </pre>
      </div>
    </div>
  )
}
