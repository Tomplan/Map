import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ImportModal from '../common/ImportModal';
import { DialogProvider } from '../../contexts/DialogContext';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../utils/dataExportImport', () => ({
  __esModule: true,
  ...jest.requireActual('../../utils/dataExportImport'),
  parseFile: jest.fn(),
}));

describe('ImportModal preview column toggle', () => {
  afterEach(() => jest.resetAllMocks());

  test('companies preview starts compact and can show all export columns', async () => {
    const { parseFile } = require('../../utils/dataExportImport');
    const { getDataConfig } = require('../../config/dataConfigs');
    const exportColumns = getDataConfig('companies').exportColumns;
    expect(exportColumns.length).toBeGreaterThan(6);

    parseFile.mockResolvedValue({
      data: [{ ID: 1, 'Company Name': 'Acme' }],
      error: null,
      metadata: null,
    });

    const { getByText, queryByText, container } = render(
      <ImportModal isOpen={true} onClose={jest.fn()} dataType="companies" existingData={[]} />,
      { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> },
    );

    fireEvent.change(container.querySelector('input[type=file]'), {
      target: { files: [new File(['fake'], 'sample.xlsx')] },
    });
    await waitFor(() => expect(getByText('Import Preview')).toBeTruthy());

    const headerCount = () => container.querySelectorAll('thead th').length;
    const compact = headerCount();
    // Select + Row + Status + 6 columns + Errors
    expect(compact).toBe(3 + 6 + 1);
    expect(queryByText(exportColumns[6].header)).toBeNull();

    fireEvent.click(getByText('common.showAllColumns'));
    expect(headerCount()).toBe(3 + exportColumns.length + 1);
    expect(getByText(exportColumns[6].header)).toBeTruthy();

    fireEvent.click(getByText('common.showFewerColumns'));
    expect(headerCount()).toBe(compact);
  });
});
