import { useState, useCallback } from 'react';

/**
 * Custom hook to manage an array of marker objects and their state.
 * @param {Array} initialMarkers - Array of marker objects from data source.
 * @returns {[Array, Function, Function]} - [markersState, updateMarker, setMarkersState]
 */
export default function useMarkersState(initialMarkers = []) {
  const [markersState, setMarkersState] = useState(initialMarkers);

  // Update a marker by id, merging new props
  const updateMarker = useCallback((id, newProps) => {
    setMarkersState((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, ...newProps } : marker
      )
    );
  }, []);

  return [markersState, updateMarker, setMarkersState];
}
