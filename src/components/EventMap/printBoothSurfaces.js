import L from 'leaflet';
import { getMarkerAngle, metersToLat, metersToLng, rotatePoint } from '../../utils/geometryHelpers';

const getPositionKey = ({ lat, lng }) => `${Number(lat).toFixed(7)},${Number(lng).toFixed(7)}`;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

function getBoothMarkers(markers) {
  return markers.filter((marker) => {
    const number = marker.glyph ?? marker.id;
    return (
      marker.type !== 'special' &&
      marker.lat !== null &&
      marker.lat !== undefined &&
      marker.lng !== null &&
      marker.lng !== undefined &&
      Number.isFinite(Number(marker.lat)) &&
      Number.isFinite(Number(marker.lng)) &&
      number !== undefined &&
      number !== null &&
      String(number).length > 0
    );
  });
}

function collectMarkerLayers(layer, result = []) {
  if (layer instanceof L.Marker) {
    result.push(layer);
  } else if (typeof layer?.eachLayer === 'function') {
    layer.eachLayer((child) => collectMarkerLayers(child, result));
  }
  return result;
}

function getRectangleLatLngs(marker, rectangleSize) {
  const center = L.latLng(marker.lat, marker.lng);
  const dimensions =
    Array.isArray(marker.rectangle) && marker.rectangle.length === 2
      ? marker.rectangle
      : rectangleSize;
  const halfWidth = Number(dimensions[0]) / 2;
  const halfHeight = Number(dimensions[1]) / 2;
  const angle = getMarkerAngle(marker);
  const corners = [
    rotatePoint(-halfWidth, -halfHeight, angle),
    rotatePoint(halfWidth, -halfHeight, angle),
    rotatePoint(halfWidth, halfHeight, angle),
    rotatePoint(-halfWidth, halfHeight, angle),
  ];

  return corners.map(([x, y]) =>
    L.latLng(center.lat + metersToLat(y), center.lng + metersToLng(x, center.lat)),
  );
}

export function addBoothSurfacePrintOverlay({ map, markers, rectangleSize, markerLayers }) {
  const booths = getBoothMarkers(markers);
  const boothPositions = new Set(booths.map(getPositionKey));
  const layersToHide = markerLayers || collectMarkerLayers(map);
  const hiddenMarkers = [];

  layersToHide.forEach((markerLayer) => {
    if (
      boothPositions.has(getPositionKey(markerLayer.getLatLng())) &&
      typeof markerLayer.setOpacity === 'function'
    ) {
      hiddenMarkers.push({ marker: markerLayer, opacity: markerLayer.options.opacity ?? 1 });
      markerLayer.setOpacity(0);
    }
  });

  const overlay = L.layerGroup();

  booths.forEach((marker) => {
    const number = marker.glyph ?? marker.id;
    const center = L.latLng(marker.lat, marker.lng);
    const rectangle = L.polygon(getRectangleLatLngs(marker, rectangleSize), {
      color: '#202020',
      weight: 1.5,
      fillColor: '#ffffff',
      fillOpacity: 0.75,
      interactive: false,
    });
    const label = L.marker(center, {
      icon: L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:80px;height:28px;color:#111;font:700 16px/1 sans-serif;white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff">${escapeHtml(number)}</div>`,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    });

    overlay.addLayer(rectangle);
    overlay.addLayer(label);
  });

  overlay.addTo(map);

  return () => {
    map.removeLayer(overlay);
    hiddenMarkers.forEach(({ marker, opacity }) => marker.setOpacity(opacity));
  };
}
