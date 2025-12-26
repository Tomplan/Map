import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ImportModal from '../common/ImportModal';
import { DialogProvider } from '../../contexts/DialogContext';

// Mock parseFile so we can return variant header names in parsed rows
jest.mock('../../utils/dataExportImport', () => ({
  __esModule: true,
  ...jest.requireActual('../../utils/dataExportImport'),
  parseFile: jest.fn(),
}));

// Mock supabase for inserts/upserts
jest.mock('../../supabaseClient', () => {
  const insertSelect = jest.fn().mockResolvedValue({ data: [{ id: 300 }], error: null });
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
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }) },
    },
    __mocks__: { insertSelect, upsertMock, categoriesSelect },
  };
});

describe('ImportModal import with header variants persists translations', () => {
  afterEach(() => jest.resetAllMocks());

  test('upserts company_translations when headers use variants', async () => {
    const { parseFile } = require('../../utils/dataExportImport');
    const { supabase } = require('../../supabaseClient');

    const mockData = [
      {
        ID: 1,
        'Company Name ': 'VariantCo',
        'Info NL': 'NL variant',
        'Info EN': 'EN variant',
        'Info DE': 'DE variant',
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

    // Wait for preview and toggle to show all columns if needed
    await waitFor(() => expect(getByText('Import Preview')).toBeTruthy());
    const toggle = getByText('Show all columns');
    fireEvent.click(toggle);

    // Click import
    fireEvent.click(getByText(/Import Selected/i));

    // Wait for supabase calls
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('companies'));

    expect(supabase.from).toHaveBeenCalledWith('company_translations');
    const upsert = supabase.from('company_translations').upsert;
    expect(upsert).toHaveBeenCalled();
    const rows = upsert.mock.calls[0][0];
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ company_id: 300, language_code: 'nl', info: 'NL variant' }),
        expect.objectContaining({ company_id: 300, language_code: 'en', info: 'EN variant' }),
        expect.objectContaining({ company_id: 300, language_code: 'de', info: 'DE variant' }),
      ]),
    );
  });
});