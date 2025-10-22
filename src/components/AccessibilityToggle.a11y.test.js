import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessibilityToggle from './AccessibilityToggle';

describe('AccessibilityToggle', () => {
  test('buttons are keyboard accessible and have correct ARIA attributes', () => {
    render(<AccessibilityToggle />);
    const highContrastBtn = screen.getByRole('button', { name: /high contrast/i });
    const largeTextBtn = screen.getByRole('button', { name: /text size/i });

    expect(highContrastBtn).toHaveAttribute('aria-pressed');
    expect(highContrastBtn).toHaveAttribute('aria-label');
    expect(highContrastBtn).toHaveAttribute('tabindex', '0');

    expect(largeTextBtn).toHaveAttribute('aria-pressed');
    expect(largeTextBtn).toHaveAttribute('aria-label');
    expect(largeTextBtn).toHaveAttribute('tabindex', '0');
  });

  test('buttons toggle state and aria-pressed', () => {
    render(<AccessibilityToggle />);
    const highContrastBtn = screen.getByRole('button', { name: /high contrast/i });
    fireEvent.click(highContrastBtn);
    expect(highContrastBtn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(highContrastBtn);
    expect(highContrastBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
