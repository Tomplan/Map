import { createNewMarker, generateUniqueMarkerId } from './markerFactory';

describe('markerFactory', () => {
  it('generateUniqueMarkerId returns unique ids', () => {
    const id1 = generateUniqueMarkerId();
    const id2 = generateUniqueMarkerId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^m\d+/);
  });

  it('createNewMarker returns marker with correct fields', () => {
    const marker = createNewMarker({ lat: 52, lng: 5 });
    expect(marker.lat).toBe(52);
    expect(marker.lng).toBe(5);
    expect(marker.id).toMatch(/^m\d+/);
    expect(marker.rectangle).toEqual([6, 6]);
    expect(marker.angle).toBe(0);
    expect(marker.coreLocked).toBe(false);
  });
});
