import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { exportToExcel } from '../utils/dataExportImport'

export default function ExcelImportExport() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show loading state immediately
    setIsLoading(true)
    setLoadingProgress('Reading file...')
    setRows([]) // Clear previous data to prevent visual conflicts

    try {
      setLoadingProgress('Parsing Excel data...')
      const data = await file.arrayBuffer()
      
      setLoadingProgress('Processing workbook...')
      const workbook = XLSX.read(data, { type: 'array' })
      
      setLoadingProgress('Extracting data...')
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      
      // Update state immediately to ensure UI updates properly
      setRows(json)
      setIsLoading(false)
      setLoadingProgress('')
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      setIsLoading(false)
      setLoadingProgress('Error loading file')
      // Clear error message after a delay but ensure UI updates immediately
      setTimeout(() => setLoadingProgress(''), 3000)
    }
  }

  const exportToExcel = async () => {
    if (!rows?.length) return

    // Prepare column configuration for the export
    const columns = Object.keys(rows[0] || {}).map(key => ({
      key: key,
      header: key,
      type: 'text' // Default to text type for general use
    }))

    // Use the proper export function that creates Excel tables with sorting support
    await exportToExcel(rows, columns, 'export', {
      freezeColumns: 1 // Freeze first column (IDs) for better usability
    })
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
            onClick={exportToExcel}
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
                transition: 'max-height 0.3s ease-in-out'
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
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M34 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 36c-2.186 0-4.216.682-5.713 1.843" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
          </svg>
          <p className="mt-2">Upload an Excel file to see preview</p>
        </div>
      )}
    </div>
  )
}
