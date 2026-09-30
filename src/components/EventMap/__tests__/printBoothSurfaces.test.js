import L from 'leaflet';
import { addBoothSurfacePrintOverlay } from '../printBoothSurfaces';

describe('addBoothSurfacePrintOverlay', () => {
  it('draws booth rectangles and centered labels while hiding booth markers', () => {
    const addedLayers = [];
    const map = {
      addLayer: jest.fn((layer) => addedLayers.push(layer)),
      removeLayer: jest.fn(),
    };
    const boothMarker = L.marker([51.9, 5.77]);
    const specialMarker = L.marker([51.91, 5.78]);
    const cleanup = addBoothSurfacePrintOverlay({
      map,
      markers: [
        { id: 12, glyph: '12', type: 'booth', lat: 51.9, lng: 5.77 },
        { id: 1001, glyph: 'i', type: 'special', lat: 51.91, lng: 5.78 },
      ],
      rectangleSize: [6, 6],
      markerLayers: [boothMarker, specialMarker],
    });

    expect(boothMarker.options.opacity).toBe(0);
    expect(specialMarker.options.opacity).toBe(1);
    expect(addedLayers).toHaveLength(1);

    const overlayLayers = [];
    addedLayers[0].eachLayer((layer) => overlayLayers.push(layer));
    expect(overlayLayers).toHaveLength(2);
    expect(overlayLayers[0]).toBeInstanceOf(L.Polygon);
    expect(overlayLayers[1].options.icon.options.html).toContain('12');

    cleanup();

    expect(map.removeLayer).toHaveBeenCalledWith(addedLayers[0]);
    expect(boothMarker.options.opacity).toBe(1);
  });

  it('escapes booth numbers before placing them in the label markup', () => {
    const addedLayers = [];
    const map = { addLayer: jest.fn((layer) => addedLayers.push(layer)), removeLayer: jest.fn() };
    const cleanup = addBoothSurfacePrintOverlay({
      map,
      markers: [{ id: 1, glyph: '<1>', type: 'booth', lat: 51.9, lng: 5.77 }],
      rectangleSize: [6, 6],
      markerLayers: [],
    });
    let label;
    addedLayers[0].eachLayer((layer) => {
      if (layer instanceof L.Marker) label = layer;
    });

    expect(label.options.icon.options.html).toContain('&lt;1&gt;');
    cleanup();
  });
});
