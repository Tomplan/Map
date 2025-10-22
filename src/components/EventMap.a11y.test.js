import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventMap from './EventMap';

describe('EventMap accessibility', () => {
  test('map container is focusable and has correct ARIA attributes', () => {
    render(<EventMap />);
    const mapRegion = screen.getByRole('region', { name: /event map/i });
    expect(mapRegion).toBeInTheDocument();
    expect(mapRegion).toHaveAttribute('tabindex', '0');
    expect(mapRegion).toHaveAttribute('aria-describedby');
    // Check for visually hidden instructions
    const instructions = screen.getByText(/use tab to focus the map/i);
    expect(instructions).toHaveClass('sr-only');
  });
});
