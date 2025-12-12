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

import { cloneMarkerLayer } from '../printCloners';

describe('printCloners.cloneMarkerLayer', () => {
  it('recreates glyph icon from layer.options.icon.options', () => {
    // Simulate a marker with full glyph icon options (as created by createMarkerIcon)
    const layer = {
      options: {
        icon: {
          options: {
            iconUrl: 'https://cdn.example.com/marker.svg',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            glyph: '42',
            glyphColor: 'white',
            glyphSize: '10px',
            glyphAnchor: [0, -7],
            prefix: '',
            className: 'booth-marker',
          },
        },
      },
      getLatLng: () => L.latLng(51.896, 5.774),
      getPopup: () => null,
    };

    const marker = cloneMarkerLayer(layer);

    expect(marker).toBeDefined();
    expect(marker.options).toBeDefined();
    expect(marker.options.icon).toBeDefined();

    const iconOpts = marker.options.icon.options;
    expect(iconOpts.iconUrl).toBe('https://cdn.example.com/marker.svg');
    expect(iconOpts.glyph).toBe('42');
    expect(iconOpts.glyphColor).toBe('white');
    expect(iconOpts.iconSize).toEqual([25, 41]);
    expect(iconOpts.iconAnchor).toEqual([12, 41]);
  });

  it('falls back to L.icon for markers without glyph options', () => {
    const layer = {
      options: {
        icon: {
          options: {
            iconUrl: 'https://cdn.example.com/simple.png',
            iconSize: [20, 30],
            iconAnchor: [10, 30],
          },
        },
      },
      getLatLng: () => L.latLng(51.9, 5.8),
      getPopup: () => null,
    };

    const marker = cloneMarkerLayer(layer);

    expect(marker).toBeDefined();
    const iconOpts = marker.options.icon.options;
    expect(iconOpts.iconUrl).toBe('https://cdn.example.com/simple.png');
    expect(iconOpts.iconSize).toEqual([20, 30]);
  });

  it('uses L.Icon.Default when no icon options available', () => {
    const layer = {
      options: {},
      getLatLng: () => L.latLng(51.85, 5.75),
      getPopup: () => null,
    };

    const marker = cloneMarkerLayer(layer);

    expect(marker).toBeDefined();
    // Should have created a marker with default icon
    expect(marker.options.icon).toBeDefined();
  });

  it('copies popup content when present', () => {
    const layer = {
      options: {
        icon: {
          options: {
            iconUrl: 'https://cdn.example.com/marker.svg',
            glyph: 'A1',
          },
        },
      },
      getLatLng: () => L.latLng(51.89, 5.77),
      getPopup: () => ({ getContent: () => '<div>Test Popup</div>' }),
    };

    const marker = cloneMarkerLayer(layer);

    expect(marker).toBeDefined();
    // Popup should be bound
    expect(marker.getPopup()).toBeDefined();
  });

  it('returns null for invisible markers (opacity: 0)', () => {
    const layer = {
      options: {
        opacity: 0,
        interactive: false,
        icon: {
          options: {
            iconUrl: 'https://cdn.example.com/search-marker.png',
          },
        },
      },
      getLatLng: () => L.latLng(51.89, 5.77),
      getPopup: () => null,
    };

    const result = cloneMarkerLayer(layer);

    expect(result).toBeNull();
  });

  it('returns null for non-interactive markers', () => {
    const layer = {
      options: {
        interactive: false,
        icon: {
          options: {
            iconUrl: 'https://cdn.example.com/marker.svg',
          },
        },
      },
      getLatLng: () => L.latLng(51.89, 5.77),
      getPopup: () => null,
    };

    const result = cloneMarkerLayer(layer);

    expect(result).toBeNull();
  });
});
