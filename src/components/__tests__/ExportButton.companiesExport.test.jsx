import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportButton from '../common/ExportButton';
import { DialogProvider } from '../../contexts/DialogContext';
import * as dataExportImport from '../../utils/dataExportImport';
import { supabase } from '../../supabaseClient';
import useCategories from '../../hooks/useCategories';

// Mock contexts
jest.mock('../../contexts/DialogContext', () => ({
  useDialog: () => ({
    toastSuccess: jest.fn(),
    toastError: jest.fn(),
  }),
  DialogProvider: ({ children }) => <div>{children}</div>,
}));

// Mock useCategories hook
jest.mock('../../hooks/useCategories', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock exporting utilities
jest.mock('../../utils/dataExportImport', () => ({
  exportToExcel: jest.fn(),
  exportToCSV: jest.fn(),
  exportToJSON: jest.fn(),
}));

// Mock supabase module
jest.mock('../../supabaseClient', () => ({
  __esModule: true,
  supabase: {
    from: jest.fn(),
  },
}));

// Define mock chaining functions (implementation details)
// These don't need to be mocks themselves if they are static,
// but using jest.fn() lets us spy on them if needed.
const mockOrder = jest.fn();
const mockIn = jest.fn();
const mockSelect = jest.fn(() => ({
  order: mockOrder,
  in: mockIn,
}));

// mockFrom returns an object with select
const mockFrom = jest.fn(() => ({ select: mockSelect }));

describe('ExportButton - Companies Export', () => {
  const mockData = [
    { id: 1, name: 'Company A' },
    { id: 2, name: 'Company B' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Wire up Supabase implementation
    supabase.from.mockImplementation(mockFrom);

    // Wire up useCategories default implementation
    useCategories.mockReturnValue({
      categories: [
        { id: '1', slug: 'tech', name: 'Technology' },
        { id: '2', slug: 'art', name: 'Art' },
      ],
      loading: false,
      error: null,
      refreshCategories: jest.fn(),
    });

    // Default Supabase successful response for categories
    mockOrder.mockResolvedValue({
      data: [
        {
          slug: 'tech',
          category_translations: [{ language: 'en', name: 'Technology' }],
        },
        {
          slug: 'art',
          category_translations: [{ language: 'en', name: 'Art' }],
        },
      ],
      error: null,
    });

    // Default Supabase successful response for company_categories
    mockIn.mockResolvedValue({
      data: [],
      error: null,
    });

    // Default successful export
    dataExportImport.exportToExcel.mockResolvedValue({ success: true });
  });

  it('fetches categories and includes them in export columns (Supabase source)', async () => {
    render(
      <DialogProvider>
        <ExportButton dataType="companies" data={mockData} />
      </DialogProvider>,
    );

    fireEvent.click(screen.getByRole('button'));
    await act(async () => {
      fireEvent.click(screen.getByText(/Excel/i));
    });

    // Verify Supabase was queried for categories
    expect(supabase.from).toHaveBeenCalledWith('categories');
    expect(mockOrder).toHaveBeenCalled();

    await waitFor(() => {
      expect(dataExportImport.exportToExcel).toHaveBeenCalled();
    });

    const columnsArg = dataExportImport.exportToExcel.mock.calls[0][1];

    expect(columnsArg.find((c) => c.key === 'category:tech')).toBeDefined();
    expect(columnsArg.find((c) => c.key === 'category:art')).toBeDefined();
  });

  it('falls back to in-memory categories when Supabase returns empty', async () => {
    // Supabase returns empty
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    // useCategories returns fallback data (default mock)

    render(
      <DialogProvider>
        <ExportButton dataType="companies" data={mockData} />
      </DialogProvider>,
    );

    fireEvent.click(screen.getByRole('button'));
    await act(async () => {
      fireEvent.click(screen.getByText(/Excel/i));
    });

    await waitFor(() => {
      expect(dataExportImport.exportToExcel).toHaveBeenCalled();
    });

    const columnsArg = dataExportImport.exportToExcel.mock.calls[0][1];

    // Should still have columns from fallback
    expect(columnsArg.find((c) => c.key === 'category:tech')).toBeDefined();
    expect(columnsArg.find((c) => c.key === 'category:art')).toBeDefined();
  });

  it('handles completely empty categories (no columns added)', async () => {
    // Supabase returns empty
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    // useCategories returns empty
    useCategories.mockReturnValue({
      categories: [],
      loading: false,
      error: null,
    });

    render(
      <DialogProvider>
        <ExportButton dataType="companies" data={mockData} />
      </DialogProvider>,
    );

    fireEvent.click(screen.getByRole('button'));
    await act(async () => {
      fireEvent.click(screen.getByText(/Excel/i));
    });

    await waitFor(() => {
      expect(dataExportImport.exportToExcel).toHaveBeenCalled();
    });

    const columnsArg = dataExportImport.exportToExcel.mock.calls[0][1];

    // Should NOT have category columns
    expect(columnsArg.find((c) => c.key && c.key.startsWith('category:'))).toBeUndefined();
    // Should still check basic columns exist
    expect(columnsArg).toContainEqual(expect.objectContaining({ key: 'name' }));
  });
});
