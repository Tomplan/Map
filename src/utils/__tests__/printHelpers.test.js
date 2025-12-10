import snapshotElementToDataUrl from '../printHelpers';

jest.mock('html2canvas', () => jest.fn());
import html2canvas from 'html2canvas';

describe('snapshotElementToDataUrl', () => {
  beforeEach(() => {
    html2canvas.mockReset();
    html2canvas.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,FAKE' });
  });

  test('calls html2canvas with default ignore rules and returns data url', async () => {
    const dummyEl = { nodeType: 1, nodeName: 'DIV' };
    const result = await snapshotElementToDataUrl(dummyEl);
    expect(html2canvas).toHaveBeenCalled();
    const opts = html2canvas.mock.calls[0][1];
    expect(typeof opts.ignoreElements).toBe('function');

    // ensure ignoreElements catches popup/tooltip/print-hide cases
    const popupEl = { classList: { contains: (c) => c === 'leaflet-popup' } };
    const tooltipEl = { classList: { contains: (c) => c === 'leaflet-tooltip' } };
    const hideEl = { classList: { contains: (c) => c === 'print-hide' } };

    expect(opts.ignoreElements(popupEl)).toBeTruthy();
    expect(opts.ignoreElements(tooltipEl)).toBeTruthy();
    expect(opts.ignoreElements(hideEl)).toBeTruthy();

    expect(result).toContain('data:image/png;base64');
  });
});
