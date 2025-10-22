import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventMap from './EventMap';

describe('EventMap', () => {
  beforeAll(() => {
    global.IntersectionObserver = class {
      constructor() {}
      observe() {}
      disconnect() {}
    };
  });
  test('renders map container with correct aria-label', () => {
    const { getByLabelText } = render(<EventMap />);
    expect(getByLabelText('Event Map')).toBeInTheDocument();
  });

  test.skip('renders Leaflet map (jsdom limitation)', async () => {
    // Skipped: jsdom does not render Leaflet's .leaflet-container in the test DOM.
    // This test should be run in a real browser environment or with Cypress/Playwright.
  });
});
