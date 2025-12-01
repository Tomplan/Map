import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import ExcelImportExport from '../ExcelImportExport'

describe('ExcelImportExport', () => {
  test('renders upload input, export button and preview', () => {
    render(<ExcelImportExport />)

    expect(screen.getByTestId('file-input')).toBeInTheDocument()
    expect(screen.getByTestId('export-btn')).toBeInTheDocument()
    expect(screen.getByTestId('preview')).toBeInTheDocument()
  })
})
