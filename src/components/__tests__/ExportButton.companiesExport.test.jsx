import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ExportButton from '../common/ExportButton';
import { DialogProvider } from '../../contexts/DialogContext';
import * as dataExport from '../../utils/dataExportImport';
import useCategories from '../../hooks/useCategories';
import { supabase } from '../../supabaseClient';

// Mock hooks globally
jest.mock('../../hooks/useCategories');

// Mock supabase client globally
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn() })),
    removeChannel: jest.fn(),
  },
}));

describe('ExportButton companies export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useCategories
    // Return loading=false and empty categories by default so tests don't fail on disabled button unless specified
    useCategories.mockReturnValue({ categories: [], loading: false });
    
    // Default supabase mock setup
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }));
  });

  test('expands categories into boolean columns and calls exportToExcel with flags', async () => {
    const companies = [
      { id: 1, name: 'Acme Co' },
      { id: 2, name: 'Beta LLC' },
    ];
    
    // Setup mock categories for this test
    useCategories.mockReturnValue({ 
      categories: [
        { slug: 'cat1', category_translations: [{ language: 'nl', name: 'Category One' }] },
        { slug: 'cat2', category_translations: [{ language: 'nl', name: 'Category Two' }] }
      ], 
      loading: false 
    });

    // Mock export functions
    const exportSpy = jest.spyOn(dataExport, 'exportToExcel').mockResolvedValue({ success: true });

    // Mock supabase behavior for additionalData override
    const mockSupabase = {
      from: jest.fn((table) => {
        return {
          select: jest.fn((args) => {
            return {
              in: (col, vals) => {
                if (table === 'company_categories') {
                  // company 1 has cat1; company 2 has none
                  return Promise.resolve({
                    data: [{ company_id: 1, categories: { slug: 'cat1' } }],
                    error: null,
                  });
                }
                return Promise.resolve({ data: [], error: null });
              },
              order: (col, opts) => Promise.resolve({ data: [], error: null }),
            };
          }),
        };
      }),
    };

    const { getByText } = render(
      <ExportButton
        dataType="companies"
        data={companies}
        filename={'companies-test-file'}
        additionalData={{ supabase: mockSupabase }}
      />,
      { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> },
    );

    // Open dropdown
    fireEvent.click(getByText('Export'));

    // Click Excel export
    const excelButton = getByText('Export as Excel (.xlsx)');
    await fireEvent.click(excelButton);

    // Assert exportToExcel was called with correct columns and data
    expect(exportSpy).toHaveBeenCalled();
    const [passedData, passedColumns] = exportSpy.mock.calls[0];

    // Check columns
    const catCols = passedColumns.filter((c) => c.key.startsWith('category:'));
    expect(catCols.length).toBe(2);
    // And they should be appended at the end of the columns array
    expect(catCols.map((c) => c.header)).toEqual(['Category One', 'Category Two']);

    // Check data
    const row1 = passedData.find((r) => r.id === 1);
    const row2 = passedData.find((r) => r.id === 2);
    expect(row1['category:cat1']).toBe('+');
    expect(row1['category:cat2']).toBe('-'); 
    expect(row2['category:cat1']).toBe('-');

    exportSpy.mockRestore();
  });

  test('disables Excel export while in-memory categories are still loading', async () => {
    // Mock useCategories to report loading=true
    useCategories.mockReturnValue({ categories: [], loading: true });

    const companies = [{ id: 1, name: 'Acme Co' }];

    const { getByText } = render(
      <ExportButton
        dataType="companies"
        data={companies}
        filename={'companies-test-file'}
      />,
      { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> },
    );

    // Open dropdown
    fireEvent.click(getByText('Export'));

    const excelButton = getByText('Export as Excel (.xlsx)');
    // The Excel export option should be rendered but disabled while categories are loading
    expect(excelButton.closest('button')).toBeDisabled();
    // And it should include a helpful tooltip/title
    expect(excelButton.closest('button').getAttribute('title')).toMatch(
      /Categories are still loading/,
    );
  });

  test('falls back to global supabase when additionalData not provided', async () => {
    // Setup mock categories 
    useCategories.mockReturnValue({ 
      categories: [
        { slug: 'cat1', category_translations: [{ language: 'nl', name: 'Category One' }] },
      ], 
      loading: false 
    });
  
    const companies = [{ id: 1, name: 'Acme Co' }];
    const exportSpy = jest.spyOn(dataExport, 'exportToExcel').mockResolvedValue({ success: true });

    // Mock global supabase behavior
    // Since we mocked useCategories, the export will try to use Supabase to fetch company_categories
    // The component defaults to globalSupabase if additionalData is missing.
    // Our global mock 'supabase' is already imported and mocked.
    
    // We need to implement the chain for global supabase.from ...
    // The chain is: from('company_categories').select(...).in(...)
    
    const mockSelect = jest.fn((args) => ({
      in: jest.fn().mockResolvedValue({
         data: [{ company_id: 1, categories: { slug: 'cat1' } }], // Mock valid response
         error: null
      })
    }));

    supabase.from.mockImplementation((table) => {
      // Mock categories fetch
      if (table === 'categories') {
         return {
             select: jest.fn().mockReturnThis(),
             order: jest.fn().mockResolvedValue({ 
                 data: [
                    { slug: 'cat1', category_translations: [{ language: 'nl', name: 'Category One' }] }
                 ], 
                 error: null 
             })
         }
      }
      if (table === 'company_categories') {
        return {
          select: mockSelect
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }
    });

    const { getByText } = render(
      <ExportButton
        dataType="companies"
        data={companies}
        filename={'companies-test-file'}
      />,
      { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> },
    );

    // Open dropdown
    fireEvent.click(getByText('Export'));
    
    // Click Excel
    await fireEvent.click(getByText('Export as Excel (.xlsx)'));
    
    expect(supabase.from).toHaveBeenCalledWith('company_categories');
    expect(exportSpy).toHaveBeenCalled();
    
    // Verify data
    const [passedData] = exportSpy.mock.calls[0];
    const row1 = passedData.find((r) => r.id === 1);
    expect(row1['category:cat1']).toBe('+');
    
    exportSpy.mockRestore();
  });
});
