import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

export default function AdminMapStateHandler({ isAdminView, selectedYear }) {
  const map = useMapEvents({
    moveend: () => {
      if (isAdminView && selectedYear) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        localStorage.setItem(
          `adminMapPrefs_${selectedYear}`,
          JSON.stringify({
            lat: center.lat,
            lng: center.lng,
            zoom: zoom,
          }),
        );
      }
    },
  });

  return null;
}
