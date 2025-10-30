// Marker factory for EventMap drag-and-drop and initial marker setup

export function createNewMarker({ lat, lng }) {
  return {
    id: generateUniqueMarkerId(),
    lat,
    lng,
    name: '',
    boothNumber: '',
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
    adminLocked: false
  };
}

// Helper to generate a unique marker id
export function generateUniqueMarkerId() {
  return `m${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
