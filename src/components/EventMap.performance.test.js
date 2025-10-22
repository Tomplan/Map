import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventMap from './EventMap';

describe('EventMap performance', () => {
  test('map is not rendered until visible', () => {
    // Mock IntersectionObserver
    const observe = jest.fn();
    const disconnect = jest.fn();
    window.IntersectionObserver = jest.fn(function (cb) {
      this.observe = observe;
      this.disconnect = disconnect;
      // Simulate not visible
      setTimeout(() => cb([{ isIntersecting: false }]), 0);
    });

    const { queryByRole } = render(<EventMap />);
    // MapContainer should not be in the document initially
    expect(queryByRole('region', { name: /event map container/i })).not.toBeInTheDocument();
  });

  test('map renders when visible', () => {
    // Mock IntersectionObserver
    window.IntersectionObserver = jest.fn(function (cb) {
      this.observe = () => {
        // Simulate visible
        cb([{ isIntersecting: true }]);
      };
      this.disconnect = jest.fn();
    });

    const { getByRole } = render(<EventMap />);
    // MapContainer should be rendered after intersection
    expect(getByRole('region', { name: /event map/i })).toBeInTheDocument();
  });
});
