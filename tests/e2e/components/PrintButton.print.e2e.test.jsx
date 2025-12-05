import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PrintButton from '../../../src/components/PrintButton';
import { waitFor } from '@testing-library/react';

jest.mock('html2canvas', () => jest.fn());
import html2canvas from 'html2canvas';

describe('PrintButton snapshot export (e2e)', () => {
  beforeEach(() => {
    html2canvas.mockReset();
    // Provide a fake canvas -> toDataURL
    html2canvas.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,FAKE' });
  });
  beforeAll(() => {
    global.openOriginal = window.open;
    window.open = jest.fn(() => ({
      document: {
        open: jest.fn(),
        close: jest.fn(),
        createElement: (name) => document.createElement(name),
        documentElement: document.documentElement,
      },
      print: jest.fn(),
      onafterprint: null,
    }));
  });

  afterAll(() => {
    window.open = global.openOriginal;
  });

  test('snapshot ignoreElements filter excludes popups, tooltips and print-hide', async () => {
    // Ensure a fake map container exists so html2canvas path is exercised
    const fakeMap = document.createElement('div');
    fakeMap.id = 'map-container';
    document.body.appendChild(fakeMap);

    render(<PrintButton mapInstance={{}} />);

    // Open menu (snapshot option is shown when no modes)
    const btn = screen.getByRole('button', { name: /Print map/i });
    act(() => fireEvent.click(btn));

    const snapshotBtn = await screen.findByText(/Snapshot \(PNG\)/i);
    expect(snapshotBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(snapshotBtn);
    });

    // html2canvas is invoked asynchronously; wait for it
    await waitFor(() => expect(html2canvas).toHaveBeenCalled(), { timeout: 3000 });
    const opts = html2canvas.mock.calls[0][1];
    expect(typeof opts.ignoreElements).toBe('function');

    const popupEl = { classList: { contains: (c) => c === 'leaflet-popup' } };
    const tooltipEl = { classList: { contains: (c) => c === 'leaflet-tooltip' } };
    const hideEl = { classList: { contains: (c) => c === 'print-hide' } };

    expect(opts.ignoreElements(popupEl)).toBeTruthy();
    expect(opts.ignoreElements(tooltipEl)).toBeTruthy();
    expect(opts.ignoreElements(hideEl)).toBeTruthy();
  });
});
