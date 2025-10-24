import L from 'leaflet';
import '../libs/Leaflet.Icon.Glyph.js';
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';

export function createMarkerIcon({ glyph = 'home', glyphColor = 'white', bgColor = 'white', glyphSize = '11px', iconUrl = '/assets/icons/glyph-marker-icon-green.svg', className }) {
  return L.icon.glyph({
    prefix: 'mdi', // Material Design Icons
    glyph,
    glyphColor,
    bgColor,
    glyphSize,
    iconUrl,
    iconSize: [25, 41],
    className
  });
}

export function createBoothMarkerIcon(number) {
  return createMarkerIcon({ className: `booth-marker booth-number-${number}` });
}

export function createSpecialMarkerIcon() {
  return createMarkerIcon({ className: 'special-marker' });
}
