import { computePrintIconOptions } from '../printScaling';
import L from 'leaflet';
import { MAP_CONFIG } from '../../config/mapConfig';

describe('computePrintIconOptions', () => {
  it('recomputes icon size for print zoom using baseIconSize', () => {
    const iconOpts = {
      iconUrl: '/assets/icons/glyph-marker-icon-blue.svg',
      iconSize: [25, 41],
      baseIconSize: [25, 41],
      glyph: '1',
      glyphSize: '11px',
      className: 'marker-icon',
      iconAnchor: [12, 41],
    };

    // Choose a printZoom that maps to a bucket of [30,50] in mapConfig
    const printZoom = 19.0;
    const recomputed = computePrintIconOptions(iconOpts, printZoom, false);

    expect(recomputed).toBeDefined();
    expect(recomputed.iconSize).toEqual([30, 50]);
    expect(recomputed.glyphSize).toBeDefined();
    // glyphSize should be roughly 11px scaled by height 50/41
    const expectedGlyph = `${(11 * (50 / 41)).toFixed(2)}px`;
    expect(recomputed.glyphSize).toEqual(expectedGlyph);
  });

  it('scales marker with custom baseIconSize proportionally', () => {
    const iconOpts = {
      iconUrl: '/assets/icons/glyph-marker-icon-blue.svg',
      iconSize: [50, 82],
      baseIconSize: [50, 82],
      glyph: 'A',
      glyphSize: '18px',
      className: 'special-marker',
      iconAnchor: [25, 82],
    };

    // Use a printZoom that maps to bucket [16,26.66] (z=18 default size [16,26.66])
    const printZoom = 18.0;
    const recomputed = computePrintIconOptions(iconOpts, printZoom, false);

    expect(recomputed).toBeDefined();
    // Special markers multiply size by mapConfig.MARKER_SIZING.SPECIAL_MARKER_MULTIPLIER
    const defaultNew = MAP_CONFIG.MARKER_SIZING.ZOOM_BUCKETS.find(
      (b) => 18 >= b.minZoom && 18 <= b.maxZoom,
    ).size;
    const expectedH = Math.round(
      defaultNew[1] *
        (iconOpts.baseIconSize[1] / (MAP_CONFIG.MARKER_SIZING.DEFAULT_SIZE[1] || 41)) *
        MAP_CONFIG.MARKER_SIZING.SPECIAL_MARKER_MULTIPLIER,
    );
    expect(recomputed.iconSize[1]).toEqual(expectedH);
    expect(recomputed.glyphSize).toBeDefined();
  });

  it('falls back to default base size when baseIconSize missing', () => {
    const iconOpts = {
      iconUrl: '/assets/icons/glyph-marker-icon-blue.svg',
      iconSize: [50, 82],
      glyph: '1',
      glyphSize: '11px',
      className: 'marker-icon',
      iconAnchor: [12, 41],
    };

    // For print zoom 19 we expect default bucket size [30,50] (per mapConfig)
    const printZoom = 19.0;
    const recomputed = computePrintIconOptions(iconOpts, printZoom, false);
    expect(recomputed.iconSize).toEqual([30, 50]);
  });
});
