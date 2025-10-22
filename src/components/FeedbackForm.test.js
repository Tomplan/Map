import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeedbackForm from './FeedbackForm';

describe('FeedbackForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('does not submit when message is empty (native validation)', async () => {
    render(<FeedbackForm />);
    expect(screen.getByLabelText(/feedback form/i)).toBeInTheDocument();
    const textarea = screen.getByLabelText(/message/i);
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByText(/submit/i));
    // The thank you message should not appear
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // Optionally check that textarea is focused
    expect(document.activeElement).toBe(textarea);
  });

  test('shows thank you after submit', () => {
    render(<FeedbackForm />);
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Great event!' } });
    fireEvent.click(screen.getByText(/submit/i));
    expect(screen.getByRole('status')).toHaveTextContent(/thank you/i);
  });

  test('stores feedback in localStorage when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    render(<FeedbackForm />);
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Offline feedback' } });
    fireEvent.click(screen.getByText(/submit/i));
    expect(JSON.parse(localStorage.getItem('feedbacks'))[0].message).toBe('Offline feedback');
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });
});
