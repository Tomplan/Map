import React, { useState } from 'react'
import * as XLSX from 'xlsx'

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

  const exportToExcel = () => {
    if (!rows?.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
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
