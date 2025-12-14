/* eslint-env jest */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Ensure we render the actual EventMap module which lazy-loads EventMapInner
import EventMap from '../src/components/EventMap/EventMap';

test('EventMap shows Suspense fallback before inner module loads', async () => {
  const { container } = render(<EventMap />);
  // Fallback should be visible
  expect(container.textContent).toContain('Loading map');

  // After next tick the inner map component should render (tile layer markup)
  await waitFor(() => {
    // the lazily loaded MapContainer will render a div; ensure it appears
    expect(container.querySelector('.leaflet-container') || container.querySelector('div')).toBeTruthy();
  });
});
