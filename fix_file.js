// Wait! `selectedMarkerId` in MapManagement vs EventClusterMarkers:
// In `MapManagement`, `selectedMarkerId` is a state variable.
// In `EventMap.jsx`, `selectedMarkerId` is passed in as a prop.
// So `isSelected` works.

// What if the problem is simply that MemoizedMarker doesn't update its draggable property properly without `key` change?
// Let's force a key update by including `isDraggable` in the key!
