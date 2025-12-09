import L from 'leaflet';
import { cloneMarkerLayer, cloneMarkerClusterLayer } from '../printCloners';

describe('printCloners', () => {
  test('cloneMarkerLayer uses iconUrl from icon options', () => {
    const original = L.marker([1, 2], {
      icon: L.icon({ iconUrl: '/images/orig.png', iconSize: [20, 30] }),
    });

    const cloned = cloneMarkerLayer(original);

    expect(cloned).toBeDefined();
    expect(cloned.options).toBeDefined();
    expect(cloned.options.icon).toBeDefined();
    expect(cloned.options.icon.options.iconUrl).toBe('/images/orig.png');
  });

  test('cloneMarkerLayer extracts background-image from dom icon when options missing', () => {
    const fakeLayer = {
      getLatLng: () => L.latLng(3, 4),
      options: {},
      _icon: {
        style: { backgroundImage: 'url("/images/domicon.png")' },
        querySelector: () => null,
      },
      getPopup: () => null,
    };

    const cloned = cloneMarkerLayer(fakeLayer);
    expect(cloned).toBeDefined();
    expect(cloned.options.icon).toBeDefined();
    expect(cloned.options.icon.options.iconUrl).toBe('/images/domicon.png');
  });

  test('cloneMarkerClusterLayer clones markers and returns a cluster with same count', () => {
    const m1 = L.marker([5, 6], { icon: L.icon({ iconUrl: '/a.png' }) });
    const m2 = L.marker([7, 8], { icon: L.icon({ iconUrl: '/b.png' }) });

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
    // markerClusterGroup has getLayers or getLayers method; try to inspect layer count
    const layers = clonedCluster.getLayers ? clonedCluster.getLayers() : [];
    expect(layers.length).toBe(2);
  });
});
