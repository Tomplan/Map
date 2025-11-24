import { createNewMarker, generateUniqueMarkerId } from './markerFactory';

describe('markerFactory', () => {
  it('generateUniqueMarkerId returns unique ids', () => {
    const id1 = generateUniqueMarkerId();
    const id2 = generateUniqueMarkerId();
    expect(id1).not.toBe(id2);
    // IDs are numeric and unique (used throughout the UI and services)
    expect(typeof id1).toBe('number');
    expect(id1).toBeGreaterThan(0);
  });

  it('createNewMarker returns marker with correct fields', () => {
    const marker = createNewMarker({ lat: 52, lng: 5 });
    expect(marker.lat).toBe(52);
    expect(marker.lng).toBe(5);
    // marker ids are numeric
    expect(typeof marker.id).toBe('number');
    expect(marker.id).toBeGreaterThan(0);
    expect(marker.rectangle).toEqual([6, 6]);
    expect(marker.angle).toBe(0);
    expect(marker.coreLocked).toBe(false);
  });
});
