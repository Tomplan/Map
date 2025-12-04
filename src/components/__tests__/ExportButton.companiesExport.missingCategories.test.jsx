import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import * as dataExport from '../../utils/dataExportImport';

describe('ExportButton companies export - missing categories', () => {
  test('falls back to single Categories column when no categories available', async () => {
    // Mock supabase to return no categories and no company_category rows
    const mockSupabase = {
      from: jest.fn((table) => {
        return {
          select: jest.fn((args) => {
            return {
              in: (col, vals) => Promise.resolve({ data: [], error: null }),
              order: (col, opts) => Promise.resolve({ data: [], error: null }),
            };
          }),
        };
      }),
    };

    // Mock useCategories to return empty
    jest.isolateModules(async () => {
      jest.doMock('../../supabaseClient', () => ({ supabase: mockSupabase }));
      jest.doMock('../../hooks/useCategories', () => ({
        __esModule: true,
        default: () => ({ categories: [] }),
      }));

      const { default: ExportButtonLocal } = await import('../common/ExportButton');

      const companies = [{ id: 1, name: 'Acme Co', categories: 'cat1, cat2' }];

      const exportSpy = jest
        .spyOn(dataExport, 'exportToExcel')
        .mockImplementation(() => Promise.resolve({ success: true }));

      const { getByText } = render(
        <ExportButtonLocal
          dataType="companies"
          data={companies}
          filename={'companies-test-file'}
        />,
        {
          wrapper: ({ children }) => {
            const { DialogProvider } = require('../../contexts/DialogContext');
            return <DialogProvider>{children}</DialogProvider>;
          },
        },
      );

      // Open dropdown then click Excel export
      fireEvent.click(getByText('Export'));
      const button = getByText('Export as Excel (.xlsx)');
      fireEvent.click(button);

      // Wait for export to be called
      await waitFor(() => expect(exportSpy).toHaveBeenCalled());

      const callArgs = exportSpy.mock.calls[0];
      const passedColumns = callArgs[1];

      // Expect original columns to still contain the single Categories column (no category: columns)
      const catCols = passedColumns.filter((c) => c.key && c.key.startsWith('category:'));
      expect(catCols.length).toBe(0);

      exportSpy.mockRestore();
    });
  });
});
