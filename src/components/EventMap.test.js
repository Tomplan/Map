import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventMap from './EventMap';

describe('EventMap', () => {
  test('renders map container with correct aria-label', () => {
    const { getByLabelText } = render(<EventMap />);
    expect(getByLabelText('Event Map')).toBeInTheDocument();
  });

  test('renders Leaflet map', () => {
    const { container } = render(<EventMap />);
    // Leaflet adds .leaflet-container class to the map div
    expect(container.querySelector('.leaflet-container')).toBeInTheDocument();
  });
});
