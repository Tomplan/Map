import React from 'react';
import { render, screen } from '@testing-library/react';
import OfflineStatus from './OfflineStatus';

describe('OfflineStatus', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('does not render when online', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    render(<OfflineStatus />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('renders offline indicator when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    render(<OfflineStatus />);
  expect(screen.getByRole('status').textContent).toContain('You are offline');
  });
});
