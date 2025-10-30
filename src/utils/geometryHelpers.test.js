import {
  getMarkerAngle,
  rotatePoint,
  metersToLat,
  metersToLng,
  metersToLatInv,
  metersToLngInv
} from './geometryHelpers';

describe('geometryHelpers', () => {
  it('getMarkerAngle returns angle or 0', () => {
    expect(getMarkerAngle({ angle: 45 })).toBe(45);
    expect(getMarkerAngle({})).toBe(0);
  });

  it('rotatePoint rotates correctly', () => {
    const [x, y] = rotatePoint(1, 0, 90);
    expect(Math.abs(x)).toBeLessThan(1e-10);
    expect(Math.abs(y - 1)).toBeLessThan(1e-10);
  });

  it('metersToLat and metersToLatInv are inverses', () => {
    const meters = 100;
    const delta = metersToLat(meters);
    expect(metersToLatInv(delta)).toBeCloseTo(meters);
  });

  it('metersToLng and metersToLngInv are inverses', () => {
    const meters = 100;
    const lat = 52;
    const delta = metersToLng(meters, lat);
    expect(metersToLngInv(delta, lat)).toBeCloseTo(meters);
  });
});
