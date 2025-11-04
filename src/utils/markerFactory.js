// Marker factory for EventMap drag-and-drop and initial marker setup

export function createNewMarker({ lat, lng }) {
  return {
    id: generateUniqueMarkerId(),
    lat,
    lng,
    name: '',
    boothNumber: null,
    rectangle: [6, 6],
    angle: 0,
    iconUrl: 'glyph-marker-icon-blue.svg',
    iconSize: [25, 41],
    iconColor: 'blue',
    className: 'marker-icon',
    prefix: '',
    glyph: '',
    glyphColor: 'white',
    glyphSize: '13px',
    glyphAnchor: [0, 0],
    coreLocked: false,
    appearanceLocked: false,
    contentLocked: false,
    adminLocked: false,
  };
}

// Helper to generate a unique marker id
export function generateUniqueMarkerId() {
  // Safe integer below PostgreSQL max (2,147,483,647)
  // Use current timestamp modulo 2_000_000_000 plus random offset
  return Math.floor((Date.now() % 2000000000) + Math.floor(Math.random() * 100000));
}
