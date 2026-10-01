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
    const mapContainer = document.createElement('div');
    const renderedBoothIcon = { textContent: '12', classList: { add: jest.fn(), remove: jest.fn() } };
    const renderedSpecialIcon = { textContent: 'i', classList: { add: jest.fn(), remove: jest.fn() } };
    const querySelectorAll = mapContainer.querySelectorAll.bind(mapContainer);
    mapContainer.querySelectorAll = (selector) =>
      selector === '.leaflet-glyph-icon'
        ? [renderedBoothIcon, renderedSpecialIcon]
        : querySelectorAll(selector);
    const map = {
      addLayer: jest.fn((layer) => {
        addedLayers.push(layer);
        mapLayers.push(layer);
      }),
      removeLayer: jest.fn(),
      eachLayer: (callback) => mapLayers.forEach(callback),
      getContainer: () => mapContainer,
      latLngToContainerPoint: () => ({ x: 100, y: 200 }),
      on: jest.fn(),
      off: jest.fn(),
    };
    const boothMarker = L.marker([51.90001, 5.77001]);
    const specialMarker = L.marker([51.91, 5.78]);
    boothMarker.options.icon = L.icon({ iconUrl: 'booth.svg' });
    boothMarker.options.icon.options.glyph = '12';
    const boothIcon = { classList: { add: jest.fn(), remove: jest.fn() } };
    const specialIcon = { classList: { add: jest.fn(), remove: jest.fn() } };
    const boothShadow = { classList: { add: jest.fn(), remove: jest.fn() } };
    const specialShadow = { classList: { add: jest.fn(), remove: jest.fn() } };
    boothMarker._icon = boothIcon;
    boothMarker._shadow = boothShadow;
    specialMarker._icon = specialIcon;
    specialMarker._shadow = specialShadow;
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
    expect(boothShadow.classList.add).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(specialShadow.classList.add).not.toHaveBeenCalled();
    expect(renderedBoothIcon.classList.add).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(renderedSpecialIcon.classList.add).not.toHaveBeenCalled();
    expect(addedLayers).toHaveLength(1);

    const overlayLayers = [];
    addedLayers[0].eachLayer((layer) => overlayLayers.push(layer));
    expect(overlayLayers).toHaveLength(2);
    expect(overlayLayers[0]).toBeInstanceOf(L.Polygon);
    expect(overlayLayers[0].options.fillOpacity).toBe(0);
    expect(overlayLayers[1]).toBeInstanceOf(L.Polygon);
    const labels = mapContainer.querySelectorAll('.booth-surface-print-label');
    expect(labels).toHaveLength(2);
    expect(labels[0].textContent).toBe('12');
    expect(labels[0].style.fontSize).toBe('12px');
    expect(labels[0].style.color).toBe('rgb(17, 17, 17)');
    expect(labels[0].style.textShadow).toBe('none');
    expect(labels[0].style.left).toBe('100px');
    expect(labels[0].style.top).toBe('200px');
    expect(labels[1].textContent).toBe('123');
    expect(labels[1].style.fontSize).toBe('10px');

    cleanup();

    expect(map.removeLayer).toHaveBeenCalledWith(addedLayers[0]);
    expect(boothMarker.options.opacity).toBe(1);
    expect(specialMarker.options.opacity).toBe(1);
    expect(boothIcon.classList.remove).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(boothShadow.classList.remove).toHaveBeenCalledWith('booth-surface-print-hidden');
    expect(renderedBoothIcon.classList.remove).toHaveBeenCalledWith('booth-surface-print-hidden');
  });

  it('keeps booth numbers as text instead of interpreting them as markup', () => {
    const addedLayers = [];
    const mapContainer = document.createElement('div');
    const map = {
      addLayer: jest.fn((layer) => addedLayers.push(layer)),
      removeLayer: jest.fn(),
      getContainer: () => mapContainer,
      latLngToContainerPoint: () => ({ x: 0, y: 0 }),
      on: jest.fn(),
      off: jest.fn(),
    };
    const cleanup = addBoothSurfacePrintOverlay({
      map,
      markers: [{ id: 1, glyph: '<1>', type: 'booth', lat: 51.9, lng: 5.77 }],
      rectangleSize: [6, 6],
      markerLayers: [],
    });
    expect(mapContainer.querySelector('.booth-surface-print-label').textContent).toBe('<1>');
    cleanup();
  });
});
