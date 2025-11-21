import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@mdi/react';
import { mdiMapMarkerPlus } from '@mdi/js';
import { useTranslation } from 'react-i18next';

// This component contains only the admin marker placement and modal logic, moved from EventMap.jsx
// NO LOGIC CHANGES, only code move

export default function AdminMarkerPlacement({ isAdminView, mapInstance, updateMarker }) {
  const { t } = useTranslation();
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [pendingMarkerId, setPendingMarkerId] = useState('');
  const [idError, setIdError] = useState('');

  // Handler for admin add marker button
  const handleAdminAddMarker = () => {
    setShowIdModal(true);
    setPendingMarkerId('');
    setIdError('');
  };

  // Handler for modal confirm
  const handleIdModalConfirm = async () => {
    if (!pendingMarkerId || isNaN(Number(pendingMarkerId))) {
      setIdError('Please enter a valid numeric ID.');
      return;
    }
    const exists = await checkMarkerIdExists(pendingMarkerId);
    if (exists) {
      setIdError('ID already exists. Please choose another.');
      return;
    }
    setShowIdModal(false);
    setIsPlacingMarker(true);
    setIdError('');
  };

  // Handler for modal cancel
  const handleIdModalCancel = () => {
    setShowIdModal(false);
    setPendingMarkerId('');
    setIdError('');
  };

  // Handler for map click to add marker (with admin ID check)
  useEffect(() => {
    if (!isPlacingMarker || !mapInstance || !pendingMarkerId) return;
    const onMapClick = (e) => {
      const latlng = e.latlng;
      // Use entered ID for marker
      const newMarker = {
        ...createNewMarker({ lat: latlng.lat, lng: latlng.lng }),
        id: Number(pendingMarkerId),
      };
      if (typeof updateMarker === 'function') {
        updateMarker(newMarker.id, newMarker, { add: true });
      }
      setIsPlacingMarker(false);
      setPendingMarkerId('');
      mapInstance.off('click', onMapClick);
    };
    mapInstance.on('click', onMapClick);
    // Cleanup in case placement is cancelled
    return () => {
      mapInstance.off('click', onMapClick);
    };
  }, [isPlacingMarker, mapInstance, updateMarker, pendingMarkerId]);

  // Helper: check if marker ID exists in Supabase
  async function checkMarkerIdExists(id) {
    try {
      const { supabase } = await import('../supabaseClient');
      // Note: Markers_Admin removed - admin data now in Event_Subscriptions
      const tables = ['Markers_Core', 'Markers_Appearance', 'Markers_Content'];
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('id').eq('id', Number(id));
        if (error) return false; // ignore error, treat as not found
        if (data && data.length > 0) return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  // UI rendering
  if (!isAdminView) return null;
  return (
    <>
      <button
        onClick={handleAdminAddMarker}
        aria-label="Add marker"
        className="bg-white rounded-full shadow p-2 flex items-center justify-center print-hide"
        style={{
          position: 'absolute',
          left: 10,
          top: 60,
          zIndex: 1001,
          width: 44,
          height: 44,
          border: 'none',
          cursor: isPlacingMarker ? 'crosshair' : 'pointer',
          background: isPlacingMarker ? '#e3f2fd' : 'white',
        }}
        title={isPlacingMarker ? 'Click on map to place marker' : 'Add marker'}
      >
        <Icon
          path={mdiMapMarkerPlus}
          size={1.5}
          color="#1976d2"
          aria-hidden="true"
          style={{ width: '42px', height: '42px' }}
        />
        <span className="sr-only">Add marker</span>
      </button>
      {/* Modal for marker ID entry */}
      {showIdModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100svh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 2px 16px rgba(25,118,210,0.15)',
              padding: 32,
              minWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h2 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 16 }}>Enter Marker ID</h2>
            <input
              type="number"
              value={pendingMarkerId}
              onChange={(e) => setPendingMarkerId(e.target.value)}
              style={{
                fontSize: 18,
                padding: '8px 12px',
                border: '2px solid #1976d2',
                borderRadius: 4,
                marginBottom: 12,
                width: '100%',
              }}
              placeholder="Marker ID (integer)"
              min={1}
            />
            {idError && <div style={{ color: 'red', marginBottom: 8 }}>{idError}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleIdModalConfirm}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 20px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
              <button
                onClick={handleIdModalCancel}
                style={{
                  background: '#eee',
                  color: '#1976d2',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 20px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper for creating new marker (move from EventMap.jsx)
function createNewMarker({ lat, lng }) {
  return {
    id: null,
    lat,
    lng,
    name: '',
    label: '',
    logo: '',
    // Note: boothNumber removed - now using glyph from Markers_Appearance
    coreLocked: false,
    // ...other marker fields as needed
  };
}
