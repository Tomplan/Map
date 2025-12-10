import html2canvas from 'html2canvas';

/**
 * Take a snapshot of an element using html2canvas with print-friendly defaults.
 * Returns a data URL (PNG).
 */
export async function snapshotElementToDataUrl(element, opts = {}) {
  if (!element) throw new Error('No element provided to snapshot');

  const defaultOpts = {
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    scale: 2,
    // Default ignore rule: hide common control classes and popups/tooltips
    ignoreElements: (el) =>
      el.classList?.contains('map-controls-print-hide') ||
      el.classList?.contains('leaflet-control-zoom') ||
      el.classList?.contains('leaflet-control-minimap') ||
      el.classList?.contains('leaflet-popup') ||
      el.classList?.contains('leaflet-tooltip') ||
      el.classList?.contains('print-hide'),
  };

  const finalOpts = { ...defaultOpts, ...opts };

  const canvas = await html2canvas(element, finalOpts);
  return canvas.toDataURL('image/png', 1.0);
}

export default snapshotElementToDataUrl;
