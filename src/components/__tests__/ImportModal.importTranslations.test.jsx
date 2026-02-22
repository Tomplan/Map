import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ImportModal from '../common/ImportModal';
import { DialogProvider } from '../../contexts/DialogContext';

// Mock parseFile so we can return metadata and parsed rows without building a real file
jest.mock('../../utils/dataExportImport', () => ({
  __esModule: true,
  ...jest.requireActual('../../utils/dataExportImport'),
  parseFile: jest.fn(),
}));

// Mock supabase client to intercept insert/upsert calls
jest.mock('../../supabaseClient', () => {
  const insertSelect = jest.fn().mockResolvedValue({ data: [{ id: 200 }], error: null });
  const upsertMock = jest.fn().mockResolvedValue({ error: null });
  const categoriesSelect = jest.fn().mockResolvedValue({ data: [], error: null });

  const from = jest.fn((table) => {
    if (table === 'companies') {
      return { insert: jest.fn(() => ({ select: insertSelect })) };
    }
    if (table === 'company_translations') {
      return { upsert: upsertMock };
    }
    if (table === 'categories') {
      return { select: categoriesSelect };
    }
    return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
  });

  return {
    supabase: {
      from,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
      },
    },
    // expose mocks for assertions
    __mocks__: { insertSelect, upsertMock, categoriesSelect },
  };
});

describe('ImportModal import persists translations', () => {
  afterEach(() => jest.resetAllMocks());

  test('upserts company_translations after creating companies from import', async () => {
    const { parseFile } = require('../../utils/dataExportImport');
    const { supabase } = require('../../supabaseClient');

    const mockData = [
      {
        ID: 1,
        'Company Name': 'Acme',
        'Info (Nederlands)': 'NL text',
        'Info (English)': 'EN text',
        'Info (Deutsch)': 'DE text',
      },
    ];

    parseFile.mockResolvedValue({ data: mockData, error: null, metadata: null });

    const onClose = jest.fn();

    const { getByText, container } = render(
      <ImportModal isOpen={true} onClose={onClose} dataType={'companies'} existingData={[]} />,
      { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> },
    );

    const input = container.querySelector('input[type=file]');
    const file = new File(['fake'], 'sample.xlsx');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for preview
    await waitFor(() => expect(getByText('Import Preview')).toBeTruthy());

    // Click import
    fireEvent.click(getByText(/Import Selected/i));

    // Wait for supabase companies insert to be called
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('companies'));

    // Then expect company_translations upsert to have been called
    expect(supabase.from).toHaveBeenCalledWith('company_translations');
    const upsert = supabase.from('company_translations').upsert;
    expect(upsert).toHaveBeenCalled();
    const rows = upsert.mock.calls[0][0];
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ company_id: 200, language_code: 'nl', info: 'NL text' }),
        expect.objectContaining({ company_id: 200, language_code: 'en', info: 'EN text' }),
        expect.objectContaining({ company_id: 200, language_code: 'de', info: 'DE text' }),
      ]),
    );
  });
});
