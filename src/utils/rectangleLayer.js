// Rectangle and handle LayerGroup logic for EventMap
import L from 'leaflet';
import {
  getMarkerAngle,
  rotatePoint,
  metersToLat,
  metersToLng,
  metersToLatInv,
  metersToLngInv
} from './geometryHelpers';

/**
 * Syncs rectangle and handle layers for markers on the map.
 * @param {object} mapInstance - Leaflet map instance
 * @param {Array} markers - Array of marker objects
 * @param {Array} rectangleSize - [width, height] in meters
 * @param {boolean} isAdminView - Is admin view enabled
 * @param {boolean} showRectanglesAndHandles - Should rectangles/handles be shown
 * @param {function} updateMarker - Callback to update marker angle
 * @param {object} rectangleLayerRef - React ref to LayerGroup
 */
export function syncRectangleLayers({
  mapInstance,
  markers,
  rectangleSize,
  isAdminView,
  showRectanglesAndHandles,
  updateMarker,
  rectangleLayerRef
}) {
  if (!mapInstance) return;
  // Create rectangle/handle LayerGroup if not exists
  if (!rectangleLayerRef.current) {
    rectangleLayerRef.current = L.layerGroup();
    rectangleLayerRef.current.addTo(mapInstance);
  }
  const rectLayerGroup = rectangleLayerRef.current;
  if (!rectLayerGroup._markerLayers) rectLayerGroup._markerLayers = {};
  // Remove layers for markers that no longer exist
  Object.keys(rectLayerGroup._markerLayers).forEach(id => {
    if (!markers.find(m => m.id === id)) {
      rectLayerGroup.removeLayer(rectLayerGroup._markerLayers[id].rectangle);
      rectLayerGroup.removeLayer(rectLayerGroup._markerLayers[id].handle);
      delete rectLayerGroup._markerLayers[id];
    }
  });
  // Add/update layers for current markers
  markers.forEach(marker => {
    if (marker.lat && marker.lng) {
      const center = L.latLng(marker.lat, marker.lng);
      // Use marker.rectangle if present, else fallback to rectangleSize
      const rectDims = Array.isArray(marker.rectangle) && marker.rectangle.length === 2
        ? marker.rectangle
        : rectangleSize;
      const halfWidth = Number(rectDims[0]) / 2;
      const halfHeight = Number(rectDims[1]) / 2;
      const angle = getMarkerAngle(marker);
      const markerBlue = '#1976d2';
      const corners = [
        rotatePoint(-halfWidth, -halfHeight, angle),
        rotatePoint(halfWidth, -halfHeight, angle),
        rotatePoint(halfWidth, halfHeight, angle),
        rotatePoint(-halfWidth, halfHeight, angle)
      ];
      const latlngs = corners.map(([x, y]) =>
        L.latLng(
          center.lat + metersToLat(y),
          center.lng + metersToLng(x, center.lat)
        )
      );
      let rectangle, handleMarker;
      if (rectLayerGroup._markerLayers[marker.id]) {
        rectangle = rectLayerGroup._markerLayers[marker.id].rectangle;
        rectangle.setLatLngs(latlngs);
        handleMarker = rectLayerGroup._markerLayers[marker.id].handle;
        const [handleX, handleY] = corners[2];
        const handleLatLng = L.latLng(
          center.lat + metersToLat(handleY),
          center.lng + metersToLng(handleX, center.lat)
        );
        handleMarker.setLatLng(handleLatLng);
      } else {
        rectangle = L.polygon(latlngs, { color: markerBlue, weight: 1 });
        const [handleX, handleY] = corners[2];
        const handleLatLng = L.latLng(
          center.lat + metersToLat(handleY),
          center.lng + metersToLng(handleX, center.lat)
        );
        let handleMarker;
        if (isAdminView && !(marker.coreLocked)) {
          const handleIcon = L.divIcon({
            className: 'rotation-handle-icon',
            html: '<div style="width:8px;height:8px;background:#1976d2;border-radius:50%;"></div>',
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          handleMarker = L.marker(handleLatLng, {
            icon: handleIcon,
            draggable: true,
            interactive: true,
            keyboard: true,
            title: 'Drag to rotate',
          });
          handleMarker.on('dragstart', function() {
            if (mapInstance) mapInstance.dragging.disable();
          });
          let lastAngle = angle;
          handleMarker.on('drag', function(e) {
            const newPos = e.target.getLatLng();
            const dx = metersToLngInv(newPos.lng - center.lng, center.lat);
            const dy = metersToLatInv(newPos.lat - center.lat);
            const angleRad = Math.atan2(dy, dx);
            let angleDeg = angleRad * 180 / Math.PI;
            if (angleDeg < 0) angleDeg += 360;
            lastAngle = angleDeg;
            const newCorners = [
              rotatePoint(-halfWidth, -halfHeight, lastAngle),
              rotatePoint(halfWidth, -halfHeight, lastAngle),
              rotatePoint(halfWidth, halfHeight, lastAngle),
              rotatePoint(-halfWidth, halfHeight, lastAngle)
            ];
            const newLatLngs = newCorners.map(([x, y]) =>
              L.latLng(
                center.lat + metersToLat(y),
                center.lng + metersToLng(x, center.lat)
              )
            );
            rectangle.setLatLngs(newLatLngs);
            const [newHandleX, newHandleY] = newCorners[2];
            const newHandleLatLng = L.latLng(
              center.lat + metersToLat(newHandleY),
              center.lng + metersToLng(newHandleX, center.lat)
            );
            handleMarker.setLatLng(newHandleLatLng);
          });
          handleMarker.on('dragend', function() {
            if (mapInstance) mapInstance.dragging.enable();
            updateMarker(marker.id, { angle: lastAngle });
          });
        } else {
          const handleIcon = L.divIcon({
            className: 'rotation-handle-icon',
            html: '<div style="width:8px;height:8px;background:#1976d2;border-radius:50%;opacity:0.5;"></div>',
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          handleMarker = L.marker(handleLatLng, {
            icon: handleIcon,
            draggable: false,
            interactive: false,
            keyboard: false,
            title: 'Locked',
          });
        }
        rectLayerGroup.addLayer(rectangle);
        rectLayerGroup.addLayer(handleMarker);
        rectLayerGroup._markerLayers[marker.id] = { rectangle, handle: handleMarker };
      }
    }
  });
  // Show/hide rectangles and handles independently
  Object.values(rectLayerGroup._markerLayers).forEach(({ rectangle, handle }) => {
    if (showRectanglesAndHandles) {
      rectLayerGroup.addLayer(rectangle);
      rectLayerGroup.addLayer(handle);
    } else {
      rectLayerGroup.removeLayer(rectangle);
      rectLayerGroup.removeLayer(handle);
    }
  });
}
