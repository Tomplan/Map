import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportButton from '../common/ExportButton';
import * as dataExportImport from '../../utils/dataExportImport';

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('../../contexts/DialogContext', () => ({
  useDialog: () => ({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
  }),
}));

jest.mock('../../hooks/useCategories', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    categories: [],
    loading: false,
    error: null,
  })),
}));

jest.mock('../../utils/dataExportImport', () => ({
  exportToExcel: jest.fn(),
  exportToCSV: jest.fn(),
  exportToJSON: jest.fn(),
}));

describe('ExportButton - Event Subscriptions Export', () => {
  const subscriptions = [
    {
      id: 101,
      company: { name: 'Acme BV' },
      event_year: 2026,
      contact: 'Jane Doe',
      phone: '12345',
      email: 'jane@example.com',
      booth_count: 2,
      area: 'Hall A',
      notes: 'Important note',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    dataExportImport.exportToCSV.mockResolvedValue({ success: true });
  });

  it('lets the user choose subscription columns before exporting', async () => {
    render(<ExportButton dataType="event_subscriptions" data={subscriptions} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    await act(async () => {
      fireEvent.click(screen.getByText('Export as CSV'));
    });

    await waitFor(() => {
      expect(screen.getByText('Select Columns to Export')).toBeInTheDocument();
    });

    const notesLabel = screen.getByTitle('Notes').closest('label');
    const notesCheckbox = notesLabel.querySelector('input[type="checkbox"]');
    fireEvent.click(notesCheckbox);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /^Export$/i })[1]);
    });

    await waitFor(() => {
      expect(dataExportImport.exportToCSV).toHaveBeenCalled();
    });

    const selectedColumns = dataExportImport.exportToCSV.mock.calls[0][1];
    expect(selectedColumns.find((column) => column.key === 'notes')).toBeUndefined();
    expect(selectedColumns.find((column) => column.key === 'company_name')).toBeDefined();
  });

  it('treats failed subscription export as an error', async () => {
    dataExportImport.exportToCSV.mockResolvedValue({ success: false, error: 'disk full' });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportButton dataType="event_subscriptions" data={subscriptions} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    await act(async () => {
      fireEvent.click(screen.getByText('Export as CSV'));
    });

    await waitFor(() => {
      expect(screen.getByText('Select Columns to Export')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /^Export$/i })[1]);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Export failed');
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
