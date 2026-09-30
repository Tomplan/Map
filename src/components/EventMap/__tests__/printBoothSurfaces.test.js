import L from 'leaflet';
import {
  addBoothSurfacePrintOverlay,
  getPrintFrameCoordinates,
} from '../printBoothSurfaces';

describe('getPrintFrameCoordinates', () => {
  const markers = [
    { id: 12, type: 'booth', lat: 51.9, lng: 5.77 },
    { id: 1001, type: 'default', lat: 51.91, lng: 5.78 },
    { id: -1, type: 'default', lat: 0, lng: 0 },
    { id: 13, type: 'booth', lat: null, lng: 5.79 },
  ];

  it('frames only positive booth marker IDs when booth-only is selected', () => {
    expect(getPrintFrameCoordinates(markers, 'booth-markers')).toEqual([[51.9, 5.77]]);
  });

  it('includes booths and specials, but excludes defaults and invalid coordinates for all markers', () => {
    expect(getPrintFrameCoordinates(markers, 'all-markers')).toEqual([
      [51.9, 5.77],
      [51.91, 5.78],
    ]);
  });
});

describe('addBoothSurfacePrintOverlay', () => {
  it('draws booth rectangles and labels without mutating on-screen marker opacity', () => {
    const addedLayers = [];
    const mapLayers = [];
    const renderedBoothIcon = { textContent: '12', classList: { add: jest.fn(), remove: jest.fn() } };
    const renderedSpecialIcon = { textContent: 'i', classList: { add: jest.fn(), remove: jest.fn() } };
    const map = {
      addLayer: jest.fn((layer) => {
        addedLayers.push(layer);
        mapLayers.push(layer);
      }),
      removeLayer: jest.fn(),
      eachLayer: (callback) => mapLayers.forEach(callback),
      getContainer: () => ({
        querySelectorAll: () => [renderedBoothIcon, renderedSpecialIcon],
      }),
    };
    const boothMarker = L.marker([51.90001, 5.77001]);
    const specialMarker = L.marker([51.91, 5.78]);
    boothMarker.options.icon = L.icon({ iconUrl: 'booth.svg' });
    boothMarker.options.icon.options.glyph = '12';
    const boothIcon = { classList: { add: jest.fn(), remove: jest.fn() } };
    const specialIcon = { classList: { add: jest.fn(), remove: jest.fn() } };
    boothMarker._icon = boothIcon;
    specialMarker._icon = specialIcon;
    const clonedCluster = {
      getAllChildMarkers: () => [boothMarker, specialMarker],
    };
    mapLayers.push(clonedCluster);
    const cleanup = addBoothSurfacePrintOverlay({
      map,
      markers: [
        { id: 12, glyph: '12', type: 'booth', lat: 51.9, lng: 5.77 },
        { id: 123, glyph: '123', type: 'booth', lat: 51.9, lng: 5.771 },
        { id: 1001, glyph: 'i', type: 'default', lat: 51.91, lng: 5.78 },
      ],
      rectangleSize: [6, 6],
    });

    expect(boothMarker.options.opacity).toBe(1);
    expect(specialMarker.options.opacity).toBe(1);
    expect(boothIcon.classList.add).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(specialIcon.classList.add).not.toHaveBeenCalled();
    expect(renderedBoothIcon.classList.add).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(renderedSpecialIcon.classList.add).not.toHaveBeenCalled();
    expect(addedLayers).toHaveLength(1);

    const overlayLayers = [];
    addedLayers[0].eachLayer((layer) => overlayLayers.push(layer));
    expect(overlayLayers).toHaveLength(4);
    expect(overlayLayers[0]).toBeInstanceOf(L.Polygon);
    expect(overlayLayers[0].options.fillOpacity).toBe(0.22);
    expect(overlayLayers[1].options.icon.options.html).toContain('12');
    expect(overlayLayers[1].options.icon.options.html).toContain('font:700 12px/1 sans-serif');
    expect(overlayLayers[1].options.icon.options.html).toContain('rgba(255,255,255,0.45)');
    expect(overlayLayers[3].options.icon.options.html).toContain('123');
    expect(overlayLayers[3].options.icon.options.html).toContain('font:700 10px/1 sans-serif');

    cleanup();

    expect(map.removeLayer).toHaveBeenCalledWith(addedLayers[0]);
    expect(boothMarker.options.opacity).toBe(1);
    expect(specialMarker.options.opacity).toBe(1);
    expect(boothIcon.classList.remove).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(renderedBoothIcon.classList.remove).toHaveBeenCalledWith('booth-surface-print-hidden');
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
