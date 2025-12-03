import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import ImportModal from '../common/ImportModal'
import { DialogProvider } from '../../contexts/DialogContext'

// Mock parseFile so we can return metadata and parsed rows without building a real file
jest.mock('../../utils/dataExportImport', () => ({
  __esModule: true,
  ...jest.requireActual('../../utils/dataExportImport'),
  parseFile: jest.fn()
}))

describe('ImportModal preview with per-category columns', () => {
  afterEach(() => jest.resetAllMocks())

  test('renders per-category columns when metadata present', async () => {
    const { parseFile } = require('../../utils/dataExportImport')

    const mockData = [ { ID: 1, 'Company Name': 'Acme', 'Category One': '+', 'Contact Person': 'Ed' } ]
    const mockMeta = { columns: [ { key: 'id', header: 'ID' }, { key: 'name', header: 'Company Name' }, { key: 'category:cat1', header: 'Category One' } ] }
    parseFile.mockResolvedValue({ data: mockData, error: null, metadata: mockMeta })

    const onClose = jest.fn()

    const { getByText, container } = render(
      <ImportModal isOpen={true} onClose={onClose} dataType={'companies'} existingData={[]} />,
      { wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider> }
    )

    // Find hidden file input and fire change to trigger parsing
    const input = container.querySelector('input[type=file]')
    const file = new File(['fake'], 'sample.xlsx')
    fireEvent.change(input, { target: { files: [file] } })

    // Wait for preview headers to include our category header
    await waitFor(() => expect(getByText('Import Preview')).toBeTruthy())
    expect(getByText('Category One')).toBeTruthy()
    // the preview should show the per-category cell value '+'
    expect(getByText('+')).toBeTruthy()
  })
})
