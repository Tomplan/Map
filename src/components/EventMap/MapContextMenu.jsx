import React, { useState, useEffect, useCallback } from 'react';
import { useMapEvents, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { mdiMapMarkerPlus, mdiStore } from '@mdi/js';
import Icon from '@mdi/react';
import { supabase } from '../../supabaseClient';

export default function MapContextMenu({ isBulkEditMode, onAddMarker }) {
  const { t } = useTranslation();
  const [position, setPosition] = useState(null);

  const map = useMapEvents({
    contextmenu(e) {
      if (isBulkEditMode) {
        setPosition(e.latlng);
      }
    },
  });

  const closeMenu = useCallback(() => {
    setPosition(null);
  }, []);

  // Close context menu when map is clicked elsewhere or dragged
  useEffect(() => {
    if (!map) return;
    const close = () => setPosition(null);
    map.on('click', close);
    map.on('dragstart', close);
    map.on('zoomstart', close);
    return () => {
      map.off('click', close);
      map.off('dragstart', close);
      map.off('zoomstart', close);
    };
  }, [map]);

  const handleAddMarker = async (type) => {
    if (!onAddMarker || !position) return;

    // Determine ID range based on type
    // Normal (Booth) < 1000, Special >= 1000
    const isSpecial = type === 'special';

    // Suggest next available ID
    let nextId = isSpecial ? 1001 : 1;

    // Fetch existing IDs to find gap/next
    // This is a simple heuristic; a robust solution would be server-side or more comprehensive
    try {
      const { data, error } = await supabase
        .from('markers_core')
        .select('id')
        .order('id', { ascending: true });

      if (!error && data) {
        const ids = data.map((m) => m.id).sort((a, b) => a - b);
        if (isSpecial) {
          // Find max special ID
          const specialIds = ids.filter((id) => id >= 1000);
          if (specialIds.length > 0) {
            nextId = Math.max(...specialIds) + 1;
          }
        } else {
          // Find first gap or max booth ID
          const boothIds = ids.filter((id) => id < 1000);
          // Simple max + 1 for now
          if (boothIds.length > 0) {
            nextId = Math.max(...boothIds) + 1;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching marker IDs', e);
    }

    // Automatically use the next available ID
    onAddMarker({
      id: nextId,
      lat: position.lat,
      lng: position.lng,
      type: isSpecial ? 'special' : 'booth',
    });
    closeMenu();
  };

  if (!position) return null;

  return (
    <Popup position={position} closeButton={false} autoPan={false}>
      <div className="flex flex-col min-w-[160px] py-1">
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left w-full transition-colors"
          onClick={() => handleAddMarker('booth')}
        >
          <Icon path={mdiStore} size={0.8} className="text-blue-600" />
          <span>Add Booth Marker</span>
        </button>
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left w-full transition-colors"
          onClick={() => handleAddMarker('special')}
        >
          <Icon path={mdiMapMarkerPlus} size={0.8} className="text-purple-600" />
          <span>Add Special Marker</span>
        </button>
      </div>
    </Popup>
  );
}
