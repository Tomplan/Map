import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../../utils/dataExportImport', () => ({
  __esModule: true,
  ...jest.requireActual('../../utils/dataExportImport'),
  parseFile: jest.fn(),
}));

describe('ImportModal review workbook import', () => {
  afterEach(() => jest.resetAllMocks());

  test('updates an existing company from review workbook headers and saves translations', async () => {
    const { parseFile } = require('../../utils/dataExportImport');

    parseFile.mockResolvedValue({
      data: [
        {
          id: 42,
          company: 'Acme Adventures',
          website: 'https://acme.example',
          nl_text: 'Nederlandse tekst',
          en_text: 'English text',
          de_text: 'Deutscher Text',
          status: 'ok',
        },
      ],
      error: null,
      metadata: null,
    });

    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn(() => ({ eq: updateEq }));
    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    const categoriesSelect = jest.fn().mockResolvedValue({ data: [], error: null });

    jest.doMock('../../supabaseClient', () => ({
      supabase: { auth: { getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'admin' } } } })) }, from: jest.fn((table) => {
          if (table === 'companies') {
            return { update: updateMock, insert: jest.fn() };
          }
          if (table === 'company_translations') {
            return { upsert: upsertMock };
          }
          if (table === 'categories') {
            return { select: categoriesSelect };
          }
          return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
        }),
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
        },
      },
    }));

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

    const existingData = [{ id: 42, name: 'Acme Adventures' }];

    const { container, getByText } = render(
      <ImportModal
        isOpen={true}
        onClose={() => {}}
        dataType={'companies'}
        existingData={existingData}
      />,
    );

    const input = container.querySelector('input[type=file]');
    const file = new File(['fake'], 'company-text-review.xlsx');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(getByText('Import Preview')).toBeTruthy());

    fireEvent.click(getByText(/Import Selected/i));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Adventures',
        website: 'https://acme.example',
      }),
    );
    expect(updateEq).toHaveBeenCalledWith('id', 42);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ company_id: 42, language_code: 'nl', info: 'Nederlandse tekst' }),
        expect.objectContaining({ company_id: 42, language_code: 'en', info: 'English text' }),
        expect.objectContaining({ company_id: 42, language_code: 'de', info: 'Deutscher Text' }),
      ]),
      expect.objectContaining({ onConflict: 'company_id,language_code' }),
    );
  });
});
