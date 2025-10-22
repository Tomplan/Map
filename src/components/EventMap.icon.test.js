import React from 'react';
import { render, screen } from '@testing-library/react';
import { MdZoomIn } from 'react-icons/md';

describe('Custom Zoom Button Icon Diagnostics', () => {
  it('renders the icon and button', () => {
    render(
      <button style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MdZoomIn size={24} color="#ff9800" />
      </button>
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
  });

  it('icon is visible and has correct size', () => {
    render(
      <button style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MdZoomIn size={24} color="#ff9800" />
      </button>
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeVisible();
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('width', '24');
  });

  it('icon is visible with 100% width/height', () => {
    render(
      <button style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MdZoomIn style={{ width: '100%', height: '100%' }} color="#ff9800" />
      </button>
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeVisible();
  });

  it('icon is visible with transform scale', () => {
    render(
      <button style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MdZoomIn style={{ transform: 'scale(1.5)' }} color="#ff9800" />
      </button>
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeVisible();
  });

  it('renders a different icon for comparison', () => {
    const { container } = render(
      <button style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff9800"><circle cx="12" cy="12" r="10" /></svg>
      </button>
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeVisible();
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('width', '24');
  });
});
