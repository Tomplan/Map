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
  test('expands categories into boolean columns and calls exportToExcel with flags', async () => {
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
    const exportSpy = jest.spyOn(dataExport, 'exportToExcel').mockImplementation(() => Promise.resolve({ success: true }))

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

    // Isolate module imports so we can mock the supabaseClient at module load time
    jest.isolateModules(async () => {
      jest.doMock('../../supabaseClient', () => ({ supabase: mockGlobalSupabase }))

      // Import the button module fresh so it picks up the mocked global
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

      const callArgs = exportSpy.mock.calls[0]
      const passedColumns = callArgs[1]

      // Category columns should be present in columns
      const catCols = passedColumns.filter(c => c.key && c.key.startsWith('category:'))
      expect(catCols.length).toBe(2)

      exportSpy.mockRestore()
    })
  })
})
