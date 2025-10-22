import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('Accessibility', () => {
  test('main heading has correct role', () => {
    const { getByRole } = render(<App />);
    const heading = getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  test('page has a landmark', () => {
    const { getByRole } = render(<App />);
    const main = getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
