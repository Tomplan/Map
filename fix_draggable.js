// If `draggableUnchanged` is false, the equality function returns `false` (meaning it DOES re-render).
// But `react-leaflet`'s `Marker` component might not update its internal `dragging` state just from a props change!
// Let's add `isDraggable` to the key inside the `filteredMarkers.map` loop.
