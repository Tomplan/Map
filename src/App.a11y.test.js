import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('Accessibility', () => {
  beforeAll(() => {
    global.IntersectionObserver = class {
      constructor() {}
      observe() {}
      disconnect() {}
    };
  });
  test('main heading has correct role and ARIA label', () => {
    const { getByRole } = render(<App />);
    const heading = getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('aria-label', 'App Title');
  });

  test('page has a landmark', () => {
    const { getByRole } = render(<App />);
    const main = getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
