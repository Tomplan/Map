import L from 'leaflet';

// Mock getBaseUrl module to avoid import.meta.env issues in Jest
jest.mock('../../../utils/getBaseUrl', () => ({
  getAbsoluteUrl: (url) => url || '',
  getBaseUrl: () => '/',
}));

// Mock L.icon.glyph for testing since the plugin isn't loaded in Jest
L.icon.glyph = jest.fn((opts) => {
  // Return an L.Icon instance with all the glyph options stored
  const icon = L.icon({
    iconUrl: opts.iconUrl,
    iconSize: opts.iconSize,
    iconAnchor: opts.iconAnchor,
    popupAnchor: opts.popupAnchor,
    shadowUrl: opts.shadowUrl,
    shadowSize: opts.shadowSize,
    shadowAnchor: opts.shadowAnchor,
    className: opts.className,
  });
  // Store glyph-specific options on the icon
  icon.options.glyph = opts.glyph;
  icon.options.glyphColor = opts.glyphColor;
  icon.options.glyphSize = opts.glyphSize;
  icon.options.glyphAnchor = opts.glyphAnchor;
  icon.options.prefix = opts.prefix;
  icon.options.bgColor = opts.bgColor;
  return icon;
});

import { cloneMarkerLayer, cloneMarkerClusterLayer } from '../printCloners';

describe('printCloners', () => {
  test('cloneMarkerLayer recreates glyph icon with all options preserved', () => {
    const original = L.marker([51.896, 5.774], {
      icon: L.icon.glyph({
        iconUrl: '/images/marker.svg',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        glyph: '1',
        glyphColor: 'white',
        glyphSize: '10px',
      }),
    });

    const cloned = cloneMarkerLayer(original);

    expect(cloned).toBeDefined();
    expect(cloned.options).toBeDefined();
    expect(cloned.options.icon).toBeDefined();

    const iconOpts = cloned.options.icon.options;
    expect(iconOpts.iconUrl).toBe('/images/marker.svg');
    expect(iconOpts.glyph).toBe('1');
    expect(iconOpts.glyphColor).toBe('white');
    expect(iconOpts.iconSize).toEqual([25, 41]);
    expect(iconOpts.iconAnchor).toEqual([12, 41]);
  });

  test('cloneMarkerLayer falls back to L.icon for non-glyph markers', () => {
    const original = L.marker([1, 2], {
      icon: L.icon({ iconUrl: '/images/orig.png', iconSize: [20, 30] }),
    });

    const cloned = cloneMarkerLayer(original);

    expect(cloned).toBeDefined();
    expect(cloned.options.icon).toBeDefined();
    expect(cloned.options.icon.options.iconUrl).toBe('/images/orig.png');
  });

  test('cloneMarkerLayer preserves marker position', () => {
    const original = L.marker([51.896645, 5.774986], {
      icon: L.icon.glyph({
        iconUrl: '/marker.svg',
        glyph: 'A',
      }),
    });

    const cloned = cloneMarkerLayer(original);
    const latLng = cloned.getLatLng();

    expect(latLng.lat).toBeCloseTo(51.896645, 5);
    expect(latLng.lng).toBeCloseTo(5.774986, 5);
  });

  test('cloneMarkerClusterLayer clones markers and returns a cluster with same count', () => {
    const m1 = L.marker([5, 6], {
      icon: L.icon.glyph({ iconUrl: '/a.png', glyph: '1' }),
    });
    const m2 = L.marker([7, 8], {
      icon: L.icon.glyph({ iconUrl: '/b.png', glyph: '2' }),
    });

    // Simulate a cluster group with eachLayer
    const fakeCluster = {
      options: { maxClusterRadius: 40 },
      eachLayer: (cb) => {
        cb(m1);
        cb(m2);
      },
    };

    const clonedCluster = cloneMarkerClusterLayer(fakeCluster);
    expect(clonedCluster).toBeDefined();

    // Check layer count
    const layers = clonedCluster.getLayers ? clonedCluster.getLayers() : [];
    expect(layers.length).toBe(2);
  });

  test('cloneMarkerLayer uses L.Icon.Default when no icon options', () => {
    const fakeLayer = {
      getLatLng: () => L.latLng(3, 4),
      options: {},
      getPopup: () => null,
    };

    const cloned = cloneMarkerLayer(fakeLayer);
    expect(cloned).toBeDefined();
    expect(cloned.options.icon).toBeDefined();
  });
});
