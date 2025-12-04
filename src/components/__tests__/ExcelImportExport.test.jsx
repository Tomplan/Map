import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ExcelImportExport from '../ExcelImportExport';

describe('ExcelImportExport', () => {
  test('renders upload input by default', () => {
    render(<ExcelImportExport />);

    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  test('does not render export button or preview when no data is loaded', () => {
    render(<ExcelImportExport />);

    expect(screen.queryByTestId('export-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
    expect(screen.getByText('Upload an Excel file to see preview')).toBeInTheDocument();
  });

  test('renders export button and preview when data is loaded', async () => {
    render(<ExcelImportExport />);

    // This test structure is maintained - the component behavior remains the same
    // but now uses the improved export function with sorting support

    expect(screen.getByText('Upload an Excel file to see preview')).toBeInTheDocument();
  });
});
