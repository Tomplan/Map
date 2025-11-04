import L from 'leaflet';
import { syncRectangleLayers } from './rectangleLayer';

describe('rectangleLayer', () => {
  it('syncRectangleLayers does not throw with minimal args', () => {
    const mapInstance = { addLayer: jest.fn() };
    const rectangleLayerRef = { current: null };
    expect(() =>
      syncRectangleLayers({
        mapInstance,
        markers: [],
        rectangleSize: [6, 6],
        isAdminView: false,
        showRectanglesAndHandles: false,
        updateMarker: jest.fn(),
        rectangleLayerRef,
      }),
    ).not.toThrow();
  });
});
