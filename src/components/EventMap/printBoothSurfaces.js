import L from 'leaflet';
import { getMarkerAngle, metersToLat, metersToLng, rotatePoint } from '../../utils/geometryHelpers';

const getPositionKey = ({ lat, lng }) => `${Number(lat).toFixed(7)},${Number(lng).toFixed(7)}`;

function getBoothMarkers(markers) {
  return markers.filter((marker) => {
    const number = marker.glyph ?? marker.id;
    const markerId = Number(marker.id);
    const isSpecialMarker =
      marker.type === 'special' ||
      marker.type === 'default' ||
      markerId <= 0 ||
      (Number.isFinite(markerId) && markerId >= 1000);
    return (
      !isSpecialMarker &&
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

export function getPrintFrameCoordinates(markers, frame) {
  return (Array.isArray(markers) ? markers : [])
    .filter((marker) => {
      const markerId = Number(marker.id);
      const hasCoordinates =
        marker.lat !== null &&
        marker.lat !== undefined &&
        marker.lng !== null &&
        marker.lng !== undefined &&
        Number.isFinite(Number(marker.lat)) &&
        Number.isFinite(Number(marker.lng));

      if (!hasCoordinates || !Number.isFinite(markerId) || markerId <= 0) return false;
      if (frame === 'booth-markers') {
        return markerId < 1000 && marker.type !== 'special' && marker.type !== 'default';
      }
      return true;
    })
    .map((marker) => [Number(marker.lat), Number(marker.lng)]);
}

function collectMarkerLayers(layer, result = []) {
  if (typeof layer?.getAllChildMarkers === 'function') {
    layer.getAllChildMarkers().forEach((marker) => collectMarkerLayers(marker, result));
  } else if (layer instanceof L.Marker) {
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
  const boothGlyphs = new Set(booths.map((marker) => String(marker.glyph ?? marker.id)));
  const markerLayersToMark = markerLayers || collectMarkerLayers(map);
  const hiddenIcons = new Set();

  markerLayersToMark.forEach((markerLayer) => {
    const glyph = markerLayer.options?.icon?.options?.glyph;
    const matchesBooth =
      (typeof markerLayer.getLatLng === 'function' &&
        boothPositions.has(getPositionKey(markerLayer.getLatLng()))) ||
      (glyph !== undefined && glyph !== null && boothGlyphs.has(String(glyph)));

    if (
      matchesBooth &&
      typeof markerLayer.setOpacity === 'function'
    ) {
      const icon = markerLayer.getElement?.() || markerLayer._icon;
      if (icon?.classList) {
        icon.classList.add('booth-surface-print-hidden');
        hiddenIcons.add(icon);
      }
      const shadow = markerLayer._shadow;
      if (shadow?.classList) {
        shadow.classList.add('booth-surface-print-hidden');
        hiddenIcons.add(shadow);
      }
    }
  });

  const mapContainer = map.getContainer?.();
  mapContainer?.querySelectorAll?.('.leaflet-glyph-icon').forEach((icon) => {
    const renderedGlyph = icon.textContent?.trim();
    if (renderedGlyph && boothGlyphs.has(renderedGlyph)) {
      icon.classList.add('booth-surface-print-hidden');
      hiddenIcons.add(icon);
    }
  });

  const overlay = L.layerGroup();
  const labelPane = document.createElement('div');
  const labels = [];
  labelPane.className = 'booth-surface-print-label-pane';
  labelPane.style.cssText =
    'position:absolute;inset:0;z-index:1000;pointer-events:none;overflow:visible';

  booths.forEach((marker) => {
    const number = marker.glyph ?? marker.id;
    const labelFontSize = String(number).length >= 3 ? 10 : 12;
    const center = L.latLng(marker.lat, marker.lng);
    const rectangle = L.polygon(getRectangleLatLngs(marker, rectangleSize), {
      color: '#202020',
      weight: 1.5,
      fillColor: '#ffffff',
      fillOpacity: 0,
      interactive: false,
    });
    const label = document.createElement('div');
    label.className = 'booth-surface-print-label';
    label.textContent = String(number);
    label.style.cssText = `position:absolute;display:flex;align-items:center;justify-content:center;width:80px;height:28px;color:#111;font:700 ${labelFontSize}px/1 sans-serif;white-space:nowrap;text-shadow:none;transform:translate(-50%,-50%);print-color-adjust:exact;-webkit-print-color-adjust:exact`;
    labelPane.appendChild(label);
    labels.push({ label, center });

    overlay.addLayer(rectangle);
  });

  const positionLabels = () => {
    labels.forEach(({ label, center }) => {
      const point = map.latLngToContainerPoint(center);
      label.style.left = `${point.x}px`;
      label.style.top = `${point.y}px`;
    });
  };

  if (mapContainer) {
    mapContainer.appendChild(labelPane);
    positionLabels();
    map.on('move zoom resize', positionLabels);
  }

  overlay.addTo(map);

  return () => {
    if (mapContainer) {
      map.off('move zoom resize', positionLabels);
      labelPane.remove();
    }
    map.removeLayer(overlay);
    hiddenIcons.forEach((icon) => icon.classList.remove('booth-surface-print-hidden'));
  };
}
