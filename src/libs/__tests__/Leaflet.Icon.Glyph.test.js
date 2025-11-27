import L from 'leaflet';

// Import our patched Glyph lib so it registers on L.Icon
import '../Leaflet.Icon.Glyph';

describe('L.Icon.Glyph _setIconStyles glyph update', () => {
  it('updates child glyph span fontSize and position when options change', () => {
    // Initial options
    const options1 = {
      iconSize: [20, 40],
      glyphSize: '12px',
      glyphColor: 'white',
      glyphAnchor: [2, 4],
      className: 'test-glyph',
      iconUrl: null,
    };

    const options2 = {
      iconSize: [40, 80],
      glyphSize: '24px',
      glyphColor: 'red',
      glyphAnchor: [4, 8],
      className: 'test-glyph',
      iconUrl: null,
    };

    const glyphIcon = new L.Icon.Glyph(options1);
    const el = glyphIcon.createIcon();

    // Ensure the glyph span exists and matches options1
    const span = el.querySelector('span');
    expect(span).toBeTruthy();
    expect(span.style.fontSize).toBe('12px');
    expect(span.style.color).toBe('white');
    expect(span.style.width).toBe('20px');
    expect(span.style.lineHeight).toBe('40px');
    expect(span.style.left).toBe('2px');
    expect(span.style.top).toBe('4px');

    // Simulate Leaflet updating styles in-place using _setIconStyles
    // Apply new options (iconSize + glyph changes)
    glyphIcon.options = { ...glyphIcon.options, ...options2 };
    glyphIcon._setIconStyles(el, 'test-glyph');

    // After update, the span should reflect new sizing/position/color
    const updatedSpan = el.querySelector('span');
    expect(updatedSpan.style.fontSize).toBe('24px');
    expect(updatedSpan.style.color).toBe('red');
    expect(updatedSpan.style.width).toBe('40px');
    expect(updatedSpan.style.lineHeight).toBe('80px');
    expect(updatedSpan.style.left).toBe('4px');
    expect(updatedSpan.style.top).toBe('8px');
  });
});
