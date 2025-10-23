import L from 'leaflet';
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';

export function createMarkerIcon({ className }) {
  return L.icon({
    iconUrl: orangeIconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
    className
  });
}

export function createBoothMarkerIcon(number) {
  return createMarkerIcon({ className: `booth-marker booth-number-${number}` });
}

export function createSpecialMarkerIcon() {
  return createMarkerIcon({ className: 'special-marker' });
}
