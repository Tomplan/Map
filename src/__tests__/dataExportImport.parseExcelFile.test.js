import * as dataExport from '../utils/dataExportImport'
import * as XLSX from 'xlsx'

describe('parseExcelFile metadata handling', () => {
  test('parses a workbook with per-category boolean columns and metadata into Categories field', async () => {
    // Build workbook with sheet - data sheet
    const rows = [
      { ID: 1, 'Company Name': 'Acme', 'Category One': 'TRUE', 'Category Two': 'FALSE' },
      { ID: 2, 'Company Name': 'Beta', 'Category One': 'FALSE', 'Category Two': 'TRUE' }
    ]

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    // Add metadata sheet with mapping to category slugs
    const meta = { columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Company Name' },
      { key: 'category:cat1', header: 'Category One' },
      { key: 'category:cat2', header: 'Category Two' }
    ] }

    // Add debugging metadata source
    meta.category_source = 'test'
    meta.category_slugs = ['cat1', 'cat2']
    const metaWs = XLSX.utils.aoa_to_sheet([[JSON.stringify(meta)]])
    XLSX.utils.book_append_sheet(wb, metaWs, '__export_metadata')

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const file = new File([blob], 'sample.xlsx')
    if (!file.arrayBuffer) {
      const payload = wbout && wbout.buffer ? wbout.buffer : wbout
      file.arrayBuffer = async () => payload
    }

    const { data, error } = await dataExport.parseExcelFile(file)
    // debug output removed
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(2)

    const r1 = data[0]
    expect(r1['Categories']).toBe('cat1')
    expect(r1['Category One']).toBeUndefined()

    const r2 = data[1]
    expect(r2['Categories']).toBe('cat2')
  })

  test('parses long-format workbook (rows per category) and aggregates into Categories', async () => {
    // Build workbook with long-format rows
    const rows = [
      { ID: 1, 'Company Name': 'Acme', 'Category Slug': 'cat1', 'Selected': 'TRUE' },
      { ID: 1, 'Company Name': 'Acme', 'Category Slug': 'cat2', 'Selected': 'FALSE' },
      { ID: 2, 'Company Name': 'Beta', 'Category Slug': 'cat1', 'Selected': 'FALSE' },
      { ID: 2, 'Company Name': 'Beta', 'Category Slug': 'cat2', 'Selected': 'TRUE' }
    ]

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    // Add metadata indicating long format
    const meta = { columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Company Name' },
      { key: 'category_slug', header: 'Category Slug' },
      { key: 'category_selected', header: 'Selected' }
    ], format: 'long' }

    const metaWs = XLSX.utils.aoa_to_sheet([[JSON.stringify(meta)]])
    XLSX.utils.book_append_sheet(wb, metaWs, '__export_metadata')

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const file = new File([blob], 'sample.xlsx')
    if (!file.arrayBuffer) {
      const payload = wbout && wbout.buffer ? wbout.buffer : wbout
      file.arrayBuffer = async () => payload
    }

    const { data, error } = await dataExport.parseExcelFile(file)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(2)

    const r1 = data.find(d => String(d['ID']) === '1')
    expect(r1['Categories']).toBe('cat1')

    const r2 = data.find(d => String(d['ID']) === '2')
    expect(r2['Categories']).toBe('cat2')
  })
})
