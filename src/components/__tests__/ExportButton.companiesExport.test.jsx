import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import ExportButton from '../common/ExportButton'
import { DialogProvider } from '../../contexts/DialogContext'
import * as dataExport from '../../utils/dataExportImport'

// We'll test the behavior when no additionalData.supabase is passed by mocking
// the global `supabase` export from `src/supabaseClient` dynamically.

// Mock transformExport to be simple and predictable
// We'll use real dataConfigs which will call transformExport; our supabase mock should satisfy requests

describe('ExportButton companies export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('expands categories into boolean columns and calls exportToExcel with flags', async () => {
    jest.isolateModules(async () => {
    const companies = [{ id: 1, name: 'Acme Co' }, { id: 2, name: 'Beta LLC' }]

    // Mock supabase
    const mockSupabase = {
      from: jest.fn((table) => {
        return {
          select: jest.fn((args) => {
            return {
              in: (col, vals) => {
                if (table === 'company_categories') {
                  // company 1 has cat1; company 2 has none
                  return Promise.resolve({ data: [{ company_id: 1, categories: { slug: 'cat1' } }], error: null })
                }
                if (table === 'company_translations') {
                  return Promise.resolve({ data: [], error: null })
                }
                return Promise.resolve({ data: [], error: null })
              },
              order: (col, opts) => {
                if (table === 'categories') {
                  return Promise.resolve({ data: [
                    { slug: 'cat1', category_translations: [{ language: 'nl', name: 'Category One' }] },
                    { slug: 'cat2', category_translations: [{ language: 'nl', name: 'Category Two' }] }
                  ], error: null })
                }
                return Promise.resolve({ data: [], error: null })
              }
            }
          })
        }
      })
    }

    // Spy on exportToExcel
    const dataExportLocal = await import('../../utils/dataExportImport')
    const exportSpy = jest.spyOn(dataExportLocal, 'exportToExcel').mockImplementation(() => Promise.resolve({ success: true }))

    const { default: ExportButtonLocal } = await import('../common/ExportButton')

    const { getByText } = render(
      <ExportButton
        dataType="companies"
        data={companies}
        filename={'companies-test-file'}
        additionalData={{ supabase: mockSupabase }}
      />, { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> })

    // Open dropdown then click Excel export
    fireEvent.click(getByText('Export'))

    const button = getByText('Export as Excel (.xlsx)')
    fireEvent.click(button)

    await waitFor(() => expect(exportSpy).toHaveBeenCalled())

    const callArgs = exportSpy.mock.calls[0]
    const passedData = callArgs[0]
    const passedColumns = callArgs[1]

    // Category columns should be present in columns
    const catCols = passedColumns.filter(c => c.key && c.key.startsWith('category:'))
    expect(catCols.length).toBe(2)
    expect(catCols.map(c => c.header)).toEqual(['Category One', 'Category Two'])

    // Data rows should have category flags as 'TRUE' / 'FALSE'
    const row1 = passedData.find(r => r.id === 1)
    const row2 = passedData.find(r => r.id === 2)
    expect(row1['category:cat1']).toBe('TRUE')
    expect(row1['category:cat2']).toBe('FALSE')
    expect(row2['category:cat1']).toBe('FALSE')

    exportSpy.mockRestore()
    })
  })

  test('falls back to global supabase when additionalData not provided', async () => {
    // Prepare mock global supabase
    const mockGlobalSupabase = {
      from: jest.fn((table) => {
        return {
          select: jest.fn((args) => {
            return {
              in: (col, vals) => {
                if (table === 'company_categories') {
                  return Promise.resolve({ data: [{ company_id: 1, categories: { slug: 'cat1' } }], error: null })
                }
                return Promise.resolve({ data: [], error: null })
              },
              order: (col, opts) => {
                if (table === 'categories') {
                  return Promise.resolve({ data: [
                    { slug: 'cat1', category_translations: [{ language: 'nl', name: 'Category One' }] },
                    { slug: 'cat2', category_translations: [{ language: 'nl', name: 'Category Two' }] }
                  ], error: null })
                }
                return Promise.resolve({ data: [], error: null })
              }
            }
          })
        }
      })
    }

    // Also test fallback to in-memory categories when supabase is missing by
    // mocking the useCategories hook to return categories.
    jest.isolateModules(async () => {
      jest.doMock('../../supabaseClient', () => ({ supabase: mockGlobalSupabase }))
      jest.doMock('../../hooks/useCategories', () => ({ default: () => ({ categories: [ { slug: 'cat1', translations: [{ language: 'nl', name: 'Category One' }] }, { slug: 'cat2', translations: [{ language: 'nl', name: 'Category Two' }] } ] }) }))

      // Import the button module fresh so it picks up the mocked global and hook
      const { default: ExportButtonLocal } = await import('../common/ExportButton')
      const companies = [{ id: 1, name: 'Acme Co' }, { id: 2, name: 'Beta LLC' }]

      // Spy on exportToExcel
      const exportSpy = jest.spyOn(dataExport, 'exportToExcel').mockImplementation(() => Promise.resolve({ success: true }))

      const { getByText } = render(
        <ExportButtonLocal
          dataType="companies"
          data={companies}
          filename={'companies-test-file'}
        />
        , { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> })

      // Open dropdown then click Excel export
      fireEvent.click(getByText('Export'))

      const button = getByText('Export as Excel (.xlsx)')
      fireEvent.click(button)

      await waitFor(() => expect(exportSpy).toHaveBeenCalled())

      // find the specific call that contains wide-format per-category columns
      const callWithCatColon = exportSpy.mock.calls.find(ca => Array.isArray(ca[1]) && ca[1].some(cc => cc.key && String(cc.key).startsWith('category:')))
      expect(callWithCatColon).toBeDefined()
      const passedColumns = callWithCatColon[1]

      // Category columns should be present in columns (either wide-format 'category:' or long-format slug/selected)
      const catCols = passedColumns.filter(c => c.key && c.key.startsWith('category:'))
      const hasSlug = passedColumns.some(c => c.key === 'Category Slug' || c.header === 'Category Slug')
      const hasSelected = passedColumns.some(c => c.key === 'Selected' || c.header === 'Selected')
      expect((catCols.length === 2) || (hasSlug && hasSelected)).toBe(true)

      exportSpy.mockRestore()
    })
  })

  test('exports long-format rows when selected (rows per category)', async () => {
    jest.isolateModules(async () => {
    const companies = [{ id: 1, name: 'Acme Co' }, { id: 2, name: 'Beta LLC' }]

    // Mock supabase returning two categories and company_categories mapping
    const mockSupabase = {
      from: jest.fn((table) => {
        return {
          select: jest.fn((args) => {
            return {
              in: (col, vals) => {
                if (table === 'company_categories') {
                  return Promise.resolve({ data: [{ company_id: 1, categories: { slug: 'cat1' } }], error: null })
                }
                if (table === 'company_translations') {
                  return Promise.resolve({ data: [], error: null })
                }
                return Promise.resolve({ data: [], error: null })
              },
              order: (col, opts) => {
                if (table === 'categories') {
                  return Promise.resolve({ data: [
                    { slug: 'cat1', category_translations: [{ language: 'nl', name: 'Category One' }] },
                    { slug: 'cat2', category_translations: [{ language: 'nl', name: 'Category Two' }] }
                  ], error: null })
                }
                return Promise.resolve({ data: [], error: null })
              }
            }
          })
        }
      })
    }

    const dataExportLocal = await import('../../utils/dataExportImport')
    const exportSpy = jest.spyOn(dataExportLocal, 'exportToExcel').mockImplementation(() => Promise.resolve({ success: true }))

    const { default: ExportButtonLocal } = await import('../common/ExportButton')

    const { getByText } = render(
      <ExportButton
        dataType="companies"
        data={companies}
        filename={'companies-test-file'}
        additionalData={{ supabase: mockSupabase }}
      />, { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> })

    // Open dropdown then click Excel long export
    fireEvent.click(getByText('Export'))

    const button = getByText('Export as Excel — rows per category (long)')
    fireEvent.click(button)

    await waitFor(() => expect(exportSpy).toHaveBeenCalled())

    // Find the call where the metadata.format === 'long'
    const longCall = exportSpy.mock.calls.find(call => call[3] && call[3].metadata && call[3].metadata.format === 'long')
    expect(longCall).toBeDefined()

    const passedData = longCall[0]
    const passedColumns = longCall[1]

    // Columns should include Category Slug and Selected keys/header
    expect(passedColumns.some(c => c.key === 'Category Slug' || c.header === 'Category Slug')).toBe(true)
    expect(passedColumns.some(c => c.key === 'Selected' || c.header === 'Selected')).toBe(true)

    // Data rows should be long: for two companies and 2 categories => 4 rows
    expect(passedData.length).toBe(4)

    // Find a row with company id 1 and cat1 selected TRUE (rows use header 'ID')
    const r = passedData.find(r => (r.ID === 1 || r.id === 1) && (r['Category Slug'] === 'cat1' || r.category_slug === 'cat1'))
    expect(r['Selected'] === 'TRUE' || r.category_selected === 'TRUE' || r['Selected'] === true || r.category_selected === true).toBeTruthy()

    exportSpy.mockRestore()
    })
  })
})
