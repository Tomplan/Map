import { useEffect } from "react";
import L from "leaflet";
import "leaflet-search";

/**
 * LeafletSearchControl
 * Adds Leaflet Search control to a given map instance.
 * Usage: <LeafletSearchControl map={mapInstance} markerLayer={layerGroup} />
 */
const LeafletSearchControl = ({ map, markerLayer }) => {
  useEffect(() => {
    if (!map || !markerLayer) return;

    // Create the search control
    const searchControl = new L.Control.Search({
      layer: markerLayer,
      initial: false,
      zoom: 20,
      marker: false,
      textPlaceholder: "Search for a marker...",
      position: "topright",
    });

    map.addControl(searchControl);

    // Cleanup on unmount
    return () => {
      map.removeControl(searchControl);
    };
  }, [map, markerLayer]);

  return null;
};

export default LeafletSearchControl;
