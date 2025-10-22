import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock IntersectionObserver for test environment
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
  };
});
import EventMap from './EventMap';

describe('EventMap custom control panel', () => {
  it('renders Material Design icons in zoom and home buttons', () => {
    render(<EventMap />);
    // Check for zoom in button/icon
    expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    // Check for zoom out button/icon
    expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
    // Check for home button/icon
    expect(screen.getByLabelText(/home/i)).toBeInTheDocument();
  });
});
