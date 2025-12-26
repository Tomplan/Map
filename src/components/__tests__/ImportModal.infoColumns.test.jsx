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

describe('ImportModal preview includes info columns for companies', () => {
  afterEach(() => jest.resetAllMocks());

  test('shows Info (Nederlands/English/Deutsch) columns in preview for companies', async () => {
    const { parseFile } = require('../../utils/dataExportImport');

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

    // Find hidden file input and fire change to trigger parsing
    const input = container.querySelector('input[type=file]');
    const file = new File(['fake'], 'sample.xlsx');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for preview headers to include Import Preview
    await waitFor(() => expect(getByText('Import Preview')).toBeTruthy());

    // By default we show a compact set of columns; toggle to show all columns
    const toggle = getByText('Show all columns');
    fireEvent.click(toggle);

    expect(getByText('Info (Nederlands)')).toBeTruthy();
    expect(getByText('Info (English)')).toBeTruthy();
    expect(getByText('Info (Deutsch)')).toBeTruthy();

    // We at least expect the headers to be present; cell content rendering is validated elsewhere
    // (values may be shown or normalized in preview mapping)
    expect(getByText('Info (Nederlands)')).toBeTruthy();
    expect(getByText('Info (English)')).toBeTruthy();
    expect(getByText('Info (Deutsch)')).toBeTruthy();
  });
});