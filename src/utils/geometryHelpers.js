// Geometry helpers for EventMap and marker logic

// Get marker angle (default 0)
export function getMarkerAngle(marker) {
  return marker.angle || 0;
}

// Rotate a point (meters offset) around origin by angle (degrees)
export function rotatePoint(x, y, angleDeg) {
  const theta = (angleDeg * Math.PI) / 180;
  const xr = x * Math.cos(theta) - y * Math.sin(theta);
  const yr = x * Math.sin(theta) + y * Math.cos(theta);
  return [xr, yr];
}

// Convert meters to latitude delta
export function metersToLat(m) {
  return m / 111320;
}

// Convert meters to longitude delta (requires latitude)
export function metersToLng(m, lat) {
  return m / (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
}

// Inverse: convert latitude delta to meters
export function metersToLatInv(deltaLat) {
  return deltaLat * 111320;
}

// Inverse: convert longitude delta to meters (requires latitude)
export function metersToLngInv(deltaLng, lat) {
  return deltaLng * (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
}
