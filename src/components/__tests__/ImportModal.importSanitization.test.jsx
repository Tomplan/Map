import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

// parseFile will be mocked to return a single company row
jest.mock('../../utils/dataExportImport', () => ({
  __esModule: true,
  ...jest.requireActual('../../utils/dataExportImport'),
  parseFile: jest.fn(),
}));

describe('ImportModal import sanitization', () => {
  beforeEach(() => {
    // keep module cache between tests here — resetting can cause multiple
    // React module instances in Jest which lead to "Invalid hook call" errors
    // when rendering components that use hooks.
  });

  test('does not send _categorySlugs or _translations to DB insert/update', async () => {
    // Ensure module mocks are fresh — we reset only mocks where needed below
    jest.resetAllMocks();

    // Prepare mock parse result (one row)
    const { parseFile } = require('../../utils/dataExportImport');
    const row = {
      ID: 1,
      'Company Name': 'SanitizeCo',
      Categories: 'cat1, cat2',
      'Contact Person': 'Joe',
    };
    parseFile.mockResolvedValue({ data: [row], error: null, metadata: null });

    // Build a mock Supabase client capturing inserts
    let lastCompanyInsert = null;
    const mockSupabase = {
      auth: { getUser: async () => ({ data: { user: { email: 'importer@test' } } }) },
      from: jest.fn((table) => {
        if (table === 'categories') {
          return {
            select: jest.fn(() =>
              Promise.resolve({
                data: [
                  { id: 1, slug: 'cat1' },
                  { id: 2, slug: 'cat2' },
                ],
                error: null,
              }),
            ),
          };
        }
        if (table === 'companies') {
          return {
            insert: jest.fn((payload) => {
              lastCompanyInsert = payload;
              return {
                select: jest.fn(() => Promise.resolve({ data: [{ id: 900 }], error: null })),
              };
            }),
          };
        }
        if (table === 'company_categories') {
          return {
            delete: jest.fn(() => Promise.resolve({})),
            insert: jest.fn(() => Promise.resolve({ error: null })),
          };
        }
        return { select: jest.fn(() => Promise.resolve({ data: [], error: null })) };
      }),
    };

    jest.doMock('../../supabaseClient', () => ({ supabase: mockSupabase }));
    // Mock dialog context to avoid needing real provider and hooks
    jest.doMock('../../contexts/DialogContext', () => ({
      __esModule: true,
      useDialog: () => ({
        toastError: jest.fn(),
        toastSuccess: jest.fn(),
        toastWarning: jest.fn(),
      }),
      DialogProvider: ({ children }) => children,
    }));

    const { default: ImportModal } = require('../common/ImportModal');

    const { container, getByText } = render(
      <ImportModal isOpen={true} onClose={() => {}} dataType={'companies'} existingData={[]} />,
    );

    // Simulate selecting a file (actual parsing is mocked so the file content doesn't matter)
    const input = container.querySelector('input[type=file]');
    const file = new File(['x'], 'sample.xlsx');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for preview to appear
    await waitFor(() => getByText('Import Preview'));

    // Click 'Import Selected' to trigger DB operations
    const importBtn = getByText(/Import Selected/i);
    fireEvent.click(importBtn);

    // Wait for supabase .from('companies').insert to be called by checking captured payload
    await waitFor(() => expect(lastCompanyInsert).not.toBeNull());

    // The inserted payload must not include underscore-prefixed metadata keys
    expect(Array.isArray(lastCompanyInsert)).toBe(true);
    const payload = lastCompanyInsert[0];
    expect(payload._categorySlugs).toBeUndefined();
    expect(payload._translations).toBeUndefined();
  });
});
