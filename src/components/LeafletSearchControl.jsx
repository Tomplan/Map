import { useEffect } from "react";
import L from "leaflet";
import "leaflet-search";

/**
 * LeafletSearchControl
 * Adds Leaflet Search control to a given map instance.
 * Usage: <LeafletSearchControl map={mapInstance} markerLayer={layerGroup} />
 */
const LeafletSearchControl = ({ map, markerLayer }) => {
  // Inject dynamic style for search button icon using BASE_URL
  useEffect(() => {
    const searchIconUrl = `${import.meta.env.BASE_URL}assets/icons/map-marker-question-blue.svg`;
    const styleId = 'leaflet-search-dynamic-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .leaflet-control-search .search-button {
          background: url('${searchIconUrl}') no-repeat center center #fff !important;
          background-size: 60% 60% !important;
        }
        .leaflet-control-search .search-button:hover {
          background: url('${searchIconUrl}') no-repeat center center #f4f4f4 !important;
          background-size: 60% 60% !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) document.head.removeChild(style);
    };
  }, []);
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
