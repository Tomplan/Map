import L from 'leaflet';
import '../libs/Leaflet.Icon.Glyph.js';
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';

export function createMarkerIcon({ glyph, glyphColor = 'white', bgColor = 'white', glyphSize = '11px', iconUrl = '/assets/icons/glyph-marker-icon-blue.svg', className, iconSize, prefix }) {
  return L.icon.glyph({
    iconUrl: iconUrl,
    iconSize: iconSize || [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [0, 0],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    prefix: prefix || '', // Material Design Icons
    glyph: glyph || '',
    glyphColor: glyphColor || 'white',
    bgColor,
    glyphSize: [35, 35],
    className
  });
}

export function createBoothMarkerIcon(number) {
  return createMarkerIcon({ className: `booth-marker booth-number-${number}` });
}

export function createSpecialMarkerIcon() {
  return createMarkerIcon({ className: 'special-marker' });
}
