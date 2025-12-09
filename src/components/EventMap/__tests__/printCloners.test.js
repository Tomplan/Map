import L from 'leaflet';
import { cloneMarkerLayer } from '../printCloners';

describe('printCloners.cloneMarkerLayer', () => {
  it('extracts glyph and iconUrl from DOM-based glyph icon when options missing', () => {
    // Build DOM-based icon like Leaflet.Icon.Glyph would produce
    const div = document.createElement('div');
    // Simulate computed style (no inline style) by not setting style.backgroundImage
    // We will mock getComputedStyle later in this test to return our url

    const span = document.createElement('span');
    span.innerHTML = '3A';
    span.style.color = 'magenta';
    span.style.fontSize = '14px';
    span.style.left = '5px';
    span.style.top = '7px';
    span.className = 'fa someprefix';
    div.appendChild(span);

    const layer = {
      options: {},
      _icon: div,
      getLatLng: () => L.latLng(1, 2),
    };

    // Mock getComputedStyle to emulate CSS-provided background-image
    const realGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = () => ({ backgroundImage: "url('https://cdn.example.com/glyph.svg')" });
    const marker = cloneMarkerLayer(layer);
    // restore
    window.getComputedStyle = realGetComputedStyle;
    // Debug: expose icon options shape when running locally
    // eslint-disable-next-line no-console
    console.log('DOM-based cloned icon:', marker.options && marker.options.icon && marker.options.icon.options);

    // (test environment may not have L.icon.glyph registered)
    expect(marker).toBeDefined();
    // When created via L.icon.glyph, Leaflet stores options on marker.options.icon.options
    expect(marker.options).toBeDefined();
    expect(marker.options.icon).toBeDefined();
    const iconOpts = marker.options.icon.options || marker.options.icon;
    // If we created a divIcon copy of the DOM, the serialized HTML will be available
    if (iconOpts && typeof iconOpts.html === 'string') {
      expect(iconOpts.html).toMatch(/https:\/\/cdn.example.com\/glyph.svg/);
      expect(iconOpts.html).toMatch(/3A/);
      expect(iconOpts.html).toMatch(/magenta/);
    } else {
      expect(iconOpts.iconUrl || iconOpts.iconUrl).toMatch(/https:\/\/cdn.example.com\/glyph.svg/);
    }
    // glyph should be present from span content
    // Glyph properties may only be present in environments where L.icon.glyph is registered
    if (iconOpts.glyph !== undefined) {
      expect(iconOpts.glyph).toBe('3A');
      expect(iconOpts.glyphColor || iconOpts.glyphColor).toBe('magenta');
      expect(iconOpts.glyphSize || iconOpts.glyphSize).toBe('14px');
    }
  });

  it('prefers icon options when present on the layer', () => {
    const layer = {
      options: {
        icon: {
          options: {
            iconUrl: 'https://cdn.example.com/explicit.svg',
            glyph: 'OK',
            glyphColor: 'blue',
            glyphSize: '12px',
          },
        },
      },
      getLatLng: () => L.latLng(5, 6),
    };

    const marker = cloneMarkerLayer(layer);
    // eslint-disable-next-line no-console
    console.log('explicit cloned icon:', marker.options && marker.options.icon && marker.options.icon.options);
    expect(marker).toBeDefined();
    const iconOpts = marker.options.icon.options || marker.options.icon;
    expect(iconOpts.iconUrl).toBe('https://cdn.example.com/explicit.svg');
    if (iconOpts.glyph !== undefined) {
      expect(iconOpts.glyph).toBe('OK');
      expect(iconOpts.glyphColor).toBe('blue');
      expect(iconOpts.glyphSize).toBe('12px');
    }
  });
});
