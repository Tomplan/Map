import React, { useState, useEffect, useMemo } from 'react';
import NumericArrayInputs from './NumericArrayInputs';
import { supabase } from '../supabaseClient';
import EventMap from './EventMap';
import BrandingSettings from './BrandingSettings';
import Icon from '@mdi/react';
import { mdiViewDashboard, mdiLock, mdiLockOpenVariant } from '@mdi/js';
import { getIconPath } from '../utils/getIconPath';
import { getLogoPath } from '../utils/getLogoPath';

// List of available SVG icons for selection
const ICON_OPTIONS = [
  'glyph-marker-icon-black.svg',
  'glyph-marker-icon-blue.svg',
  'glyph-marker-icon-gray.svg',
  'glyph-marker-icon-green.svg',
  'glyph-marker-icon-orange.svg',
  'glyph-marker-icon-purple.svg',
  'glyph-marker-icon-red.svg',
  'glyph-marker-icon-yellow.svg',
];
const ICON_PATH_PREFIX = `${import.meta.env.BASE_URL}assets/icons/`;

export default function AdminDashboard({
  markersState,
  setMarkersState,
  updateMarker,
  isAdminView,
}) {
  // Track iconSize input values for each marker by ID
  const [iconSizeInputs, setIconSizeInputs] = useState({});

  // Sync iconSizeInputs with markersState when markersState changes
  useEffect(() => {
    if (!markersState) return;
    const newInputs = {};
    markersState.forEach((marker) => {
      const val = marker.iconSize;
      newInputs[marker.id] = Array.isArray(val) ? val.join(', ') : (val ?? '');
    });
    setIconSizeInputs(newInputs);
  }, [markersState]);
  // Popover state for icon selection (for iconUrl field)
  const [iconPopover, setIconPopover] = useState({ open: false, markerId: null });
  // Basic field edit handler for table cells
  async function handleFieldChange(id, key, value) {
    // Lock fields must always be boolean
    const lockFields = ['coreLocked', 'appearanceLocked', 'contentLocked', 'adminLocked'];
    let sendValue = value;
    if (!lockFields.includes(key)) {
      // For non-lock fields, treat empty string, empty array, or undefined as null
      if (value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) {
        sendValue = null;
      }
    }
    setMarkersState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, [key]: sendValue } : m));
      return updated;
    });
    // Determine which table to update
    let table = 'Markers_Core';
    if (
      [
        'iconUrl',
        'iconSize',
        'iconColor',
        'className',
        'prefix',
        'glyph',
        'glyphColor',
        'glyphSize',
        'glyphAnchor',
      ].includes(key)
    ) {
      table = 'Markers_Appearance';
    } else if (['boothNumber', 'name', 'logo', 'website', 'info'].includes(key)) {
      table = 'Markers_Content';
    } else if (
      [
        'contact',
        'phone',
        'email',
        'boothCount',
        'area',
        'coins',
        'breakfast',
        'lunch',
        'bbq',
        'notes',
      ].includes(key)
    ) {
      table = 'Markers_Admin';
    }
    // Sync to Supabase
    await supabase
      .from(table)
      .update({ [key]: sendValue })
      .eq('id', id);
  }
  const [showDashboard, setShowDashboard] = useState(false);
  // Branding settings save handler
  const handleBrandingChange = async (newSettings) => {
    await supabase.from('Branding').upsert({ id: 1, ...newSettings });
  };
  // Tabs and columns remain for UI, but marker data comes from markersState
  const TABS = [
    { key: 'core', label: 'Markers - Core' },
    { key: 'appearance', label: 'Markers - Appearance' },
    { key: 'content', label: 'Markers - Content' },
    { key: 'admin', label: 'Markers - Admin' },
  ];
  const COLUMNS = {
    core: [
      { key: 'id', label: 'ID' },
      { key: 'boothNumber', label: 'Booth #' },
      { key: 'name', label: 'Name' },
      { key: 'lat', label: 'Lat' },
      { key: 'lng', label: 'Lng' },
      { key: 'rectangle', label: 'Rectangle' },
      { key: 'angle', label: 'Angle' },
    ],
    appearance: [
      { key: 'id', label: 'ID' },
      { key: 'boothNumber', label: 'Booth #' },
      { key: 'name', label: 'Name' },
      { key: 'iconUrl', label: 'Icon' },
      { key: 'iconSize', label: 'Icon Size' },
      { key: 'className', label: 'Class Name' },
      { key: 'prefix', label: 'Prefix' },
      { key: 'glyph', label: 'Glyph' },
      { key: 'glyphColor', label: 'Glyph Color' },
      { key: 'glyphSize', label: 'Glyph Size' },
      { key: 'glyphAnchor', label: 'Glyph Anchor' },
    ],
    content: [
      { key: 'id', label: 'ID' },
      { key: 'boothNumber', label: 'Booth #' },
      { key: 'name', label: 'Name' },
      { key: 'logo', label: 'Logo' },
      { key: 'website', label: 'Website' },
      { key: 'info', label: 'Info' },
    ],
    admin: [
      { key: 'id', label: 'ID' },
      { key: 'boothNumber', label: 'Booth #' },
      { key: 'name', label: 'Name' },
      { key: 'contact', label: 'Contact' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'boothCount', label: 'Booth Count' },
      { key: 'area', label: 'Area' },
      { key: 'coins', label: 'Coins' },
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'bbq', label: 'BBQ' },
      { key: 'notes', label: 'Notes' },
    ],
  };
  const [activeTab, setActiveTab] = useState('core');
  // Sorting state: column and direction per tab
  const [sortState, setSortState] = useState({
    core: { column: 'id', direction: 'asc' },
    appearance: { column: 'id', direction: 'asc' },
    content: { column: 'id', direction: 'asc' },
    admin: { column: 'id', direction: 'asc' },
  });

  // Handle sort change
  function handleSort(tab, column) {
    setSortState((prev) => {
      const current = prev[tab];
      // Toggle direction if same column, else default to asc
      const direction =
        current.column === column ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc';
      return { ...prev, [tab]: { column, direction } };
    });
  }
  // Auth state
  // Remove unused auth state

  // Remove unused auth effect

  // Use markersState for all tabbed marker data
  const sortedMarkers = React.useMemo(() => {
    const tab = activeTab;
    const markers = markersState || [];
    const { column, direction } = sortState[tab];
    let getValue = (m) => m[column];
    return [...markers].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va == null && vb == null) return 0;
      if (va == null) return direction === 'asc' ? -1 : 1;
      if (vb == null) return direction === 'asc' ? 1 : -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return direction === 'asc' ? va - vb : vb - va;
      }
      return direction === 'asc'
        ? String(va).localeCompare(String(vb), undefined, { numeric: true })
        : String(vb).localeCompare(String(va), undefined, { numeric: true });
    });
  }, [markersState, activeTab, sortState]);
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Lock/unlock marker for current tab
  async function toggleLock(id) {
    setMarkersState((prev) => {
      return prev.map((m) => {
        if (m.id !== id) return m;
        if (activeTab === 'appearance') {
          return { ...m, appearanceLocked: !m.appearanceLocked };
        } else if (activeTab === 'content') {
          return { ...m, contentLocked: !m.contentLocked };
        } else if (activeTab === 'admin') {
          return { ...m, adminLocked: !m.adminLocked };
        } else {
          return { ...m, coreLocked: !m.coreLocked };
        }
      });
    });
    // Auto-save to Supabase
    const currentMarker = markersState.find((m) => m.id === id);
    if (currentMarker) {
      if (activeTab === 'appearance') {
        const newAppearanceLocked = !currentMarker.appearanceLocked;
        await supabase
          .from('Markers_Appearance')
          .update({ appearanceLocked: newAppearanceLocked })
          .eq('id', id);
      } else if (activeTab === 'content') {
        const newContentLocked = !currentMarker.contentLocked;
        await supabase
          .from('Markers_Content')
          .update({ contentLocked: newContentLocked })
          .eq('id', id);
      } else if (activeTab === 'admin') {
        const newAdminLocked = !currentMarker.adminLocked;
        await supabase.from('Markers_Admin').update({ adminLocked: newAdminLocked }).eq('id', id);
      } else {
        const newCoreLocked = !currentMarker.coreLocked;
        await supabase.from('Markers_Core').update({ coreLocked: newCoreLocked }).eq('id', id);
      }
    }
  }

  // Undo/redo logic for marker state
  function undo() {
    if (undoStack.length === 0) return;
    setRedoStack([markersState, ...redoStack]);
    setMarkersState(undoStack[undoStack.length - 1]);
    setUndoStack(undoStack.slice(0, -1));
  }
  function redo() {
    if (redoStack.length === 0) return;
    setUndoStack([...undoStack, markersState]);
    setMarkersState(redoStack[0]);
    setRedoStack(redoStack.slice(1));
  }

  // Select marker for editing
  function selectMarker(id) {
    setSelected(id);
  }

  // Export current tab markers as JSON
  function exportMarkers() {
    const dataStr = JSON.stringify(sortedMarkers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markers-${activeTab}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Branding state for live sync
  const [branding, setBranding] = useState({
    logo: `${import.meta.env.BASE_URL}assets/logos/4x4Vakantiebeurs.png`,
    themeColor: '#ffffff',
    fontFamily: 'Arvo, Sans-serif',
    eventName: '4x4 Vakantiebeurs',
    id: 1,
  });

  // Fetch initial branding data
  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase.from('Branding').select('*').eq('id', 1).single();
      if (data) setBranding(data);
    }
    fetchBranding();
    // Subscribe to realtime updates
    const channel = supabase
      .channel('branding-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Branding',
          filter: 'id=eq.1',
        },
        (payload) => {
          if (payload.new) setBranding(payload.new);
        },
      )
      .subscribe();
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* Map fills the whole screen */}
      <div className="absolute inset-0 w-full h-full">
        {/* Dashboard button now inside map container, top-left */}
        <button
          className="fixed top-2 right-20 z-50 bg-white rounded-full shadow-md p-3 flex items-center gap-2 hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle dashboard"
          onClick={() => setShowDashboard((v) => !v)}
        >
          <Icon path={mdiViewDashboard} size={1.2} color="#1976d2" />
          <span className="font-semibold" style={{ color: '#1976d2' }}>
            Dashboard
          </span>
        </button>
        {/* Map is now rendered only by parent (App.jsx) */}
      </div>
      {/* Dashboard panel overlays map when open */}
      {showDashboard && (
        <div className="absolute inset-5 left-2 right-16 z-40 flex justify-start items-start pt-20">
          <div
            className="bg-white rounded-lg shadow-2xl p-2 w-full"
            style={{ maxHeight: '100vh', overflowY: 'auto', opacity: 0.9 }}
          >
            {/* Branding settings at top of dashboard */}
            <div className="w-full flex justify-center mb-6">
              <BrandingSettings onChange={handleBrandingChange} initialValues={branding} />
            </div>
            {/* Marker tables for each tab */}
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    marginRight: 8,
                    padding: '0.5rem 1rem',
                    background: activeTab === tab.key ? '#1976d2' : '#eee',
                    color: activeTab === tab.key ? '#fff' : '#333',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <table className="w-full rounded" style={{ tableLayout: 'fixed', fontSize: '12px' }}>
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    {COLUMNS[activeTab].map((col) => {
                      const isSorted = sortState[activeTab].column === col.key;
                      const arrow = isSorted
                        ? sortState[activeTab].direction === 'asc'
                          ? '▲'
                          : '▼'
                        : '';
                      // For core tab, make id column small
                      const thStyle = {
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        background: '#f3f4f6',
                        minWidth:
                          col.key === 'id'
                            ? 80
                            : col.key === 'boothNumber'
                              ? 80
                              : col.key === 'iconUrl'
                                ? 40
                                : undefined,
                        width:
                          col.key === 'id'
                            ? 80
                            : col.key === 'boothNumber'
                              ? 80
                              : col.key === 'iconUrl'
                                ? 40
                                : undefined,
                        maxWidth:
                          col.key === 'id'
                            ? 80
                            : col.key === 'boothNumber'
                              ? 80
                              : col.key === 'iconUrl'
                                ? 40
                                : undefined,
                        cursor: 'pointer',
                      };
                      return (
                        <th
                          key={col.key}
                          className="p-2 text-left select-none hover:bg-blue-50"
                          style={thStyle}
                          onClick={() => handleSort(activeTab, col.key)}
                          title={`Sort by ${col.label}`}
                        >
                          <span style={{ userSelect: 'none' }}>
                            {col.label} {arrow}
                          </span>
                        </th>
                      );
                    })}
                    <th
                      className="p-0 text-right"
                      style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        background: '#f3f4f6',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        cursor: 'pointer',
                        minWidth: '90px',
                        width: '90px',
                        maxWidth: '120px',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Global lock button row in actions column */}
                  {sortedMarkers.length > 0 && (
                    <tr
                      className="bg-white"
                      style={{ position: 'sticky', top: '33.5px', zIndex: 2 }}
                    >
                      {COLUMNS[activeTab].map((col) => (
                        <td key={col.key} className="p-0 border-b"></td>
                      ))}
                      <td className="py-1 px-3 border-b text-left">
                        <div className="flex justify-center p-0">
                          <button
                            onClick={async () => {
                              let lockKey = 'coreLocked';
                              let table = 'Markers_Core';
                              if (activeTab === 'appearance') {
                                lockKey = 'appearanceLocked';
                                table = 'Markers_Appearance';
                              } else if (activeTab === 'content') {
                                lockKey = 'contentLocked';
                                table = 'Markers_Content';
                              } else if (activeTab === 'admin') {
                                lockKey = 'adminLocked';
                                table = 'Markers_Admin';
                              }
                              const allLocked = sortedMarkers.every((m) => m[lockKey]);
                              const updatedMarkers = markersState.map((m) =>
                                sortedMarkers.some((sm) => sm.id === m.id)
                                  ? { ...m, [lockKey]: !allLocked }
                                  : m,
                              );
                              setMarkersState(updatedMarkers);
                              sortedMarkers.forEach(async (marker) => {
                                await supabase
                                  .from(table)
                                  .update({ [lockKey]: !allLocked })
                                  .eq('id', marker.id);
                              });
                            }}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition flex items-center justify-center"
                            title="Lock or unlock all rows"
                          >
                            {(
                              activeTab === 'appearance'
                                ? sortedMarkers.every((m) => m.appearanceLocked)
                                : activeTab === 'content'
                                  ? sortedMarkers.every((m) => m.contentLocked)
                                  : activeTab === 'admin'
                                    ? sortedMarkers.every((m) => m.adminLocked)
                                    : sortedMarkers.every((m) => m.coreLocked)
                            ) ? (
                              <Icon path={mdiLock} size={0.8} />
                            ) : (
                              <Icon path={mdiLockOpenVariant} size={0.8} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {sortedMarkers.map((marker) => (
                    <tr
                      key={marker.id}
                      className={
                        selected === marker.id
                          ? 'bg-blue-50 text-gray-900'
                          : 'bg-white text-gray-900'
                      }
                    >
                      {COLUMNS[activeTab].map((col) => {
                        const cellStyle =
                          col.key === 'iconUrl'
                            ? { minWidth: 40, width: 40, maxWidth: 40 }
                            : undefined;
                        const value = marker[col.key];
                        let isReference = false;
                        let referenceTooltip = '';
                        if (col.key === 'id' && activeTab !== 'core') {
                          isReference = true;
                          referenceTooltip =
                            'Reference field from Markers_Core; cannot be edited here.';
                        }
                        if (
                          (col.key === 'boothNumber' || col.key === 'name') &&
                          activeTab !== 'content'
                        ) {
                          isReference = true;
                          referenceTooltip =
                            'Reference field from Markers_Content; cannot be edited here.';
                        }
                        // Appearance tab: glyphAnchor editable as numeric array
                        if (
                          col.key === 'glyphAnchor' &&
                          activeTab === 'appearance' &&
                          !marker.appearanceLocked
                        ) {
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <NumericArrayInputs
                                value={Array.isArray(value) ? value : [0, 0]}
                                onChange={(arr) => handleFieldChange(marker.id, col.key, arr)}
                                labels={['X', 'Y']}
                                length={2}
                              />
                            </td>
                          );
                        }
                        // ...existing cell rendering logic...
                        // Content tab: editable if contentLocked is false
                        if (activeTab === 'content' && !marker.contentLocked) {
                          if (col.key === 'logo') {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <input
                                  type="text"
                                  value={value ?? ''}
                                  onChange={(e) =>
                                    handleFieldChange(marker.id, col.key, e.target.value)
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                />
                              </td>
                            );
                          }
                          if (Array.isArray(value)) {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <input
                                  type="text"
                                  value={value.join(', ')}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      marker.id,
                                      col.key,
                                      e.target.value.split(',').map((v) => v.trim()),
                                    )
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                />{' '}
                              </td>
                            );
                          }
                          if (typeof value === 'object' && value !== null) {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <input
                                  type="text"
                                  value={JSON.stringify(value)}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      marker.id,
                                      col.key,
                                      JSON.parse(e.target.value),
                                    )
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                />{' '}
                              </td>
                            );
                          }
                          if (typeof value === 'boolean') {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <select
                                  value={value ? 'true' : 'false'}
                                  onChange={(e) =>
                                    handleFieldChange(marker.id, col.key, e.target.value === 'true')
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                >
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              </td>
                            );
                          }
                          if (col.key === 'info') {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <textarea
                                  value={value ?? ''}
                                  onChange={(e) =>
                                    handleFieldChange(marker.id, col.key, e.target.value)
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                  rows={3}
                                />
                              </td>
                            );
                          }
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <input
                                type="text"
                                value={value ?? ''}
                                onChange={(e) =>
                                  handleFieldChange(marker.id, col.key, e.target.value)
                                }
                                className="w-full bg-white border rounded px-2 py-1"
                              />
                            </td>
                          );
                        }
                        // Content tab: locked, show logo image for logo column, else read-only
                        if (activeTab === 'content' && marker.contentLocked) {
                          if (col.key === 'logo' && value) {
                            const logoPath = getLogoPath(value);
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <img src={logoPath} alt="logo" width={24} height={24} />{' '}
                              </td>
                            );
                          }
                          return (
                            <td
                              key={col.key}
                              className="py-1 px-3 border-b text-left text-gray-500 italic"
                            >
                              {value}
                            </td>
                          );
                        }
                        if (isReference) {
                          return (
                            <td
                              key={col.key}
                              className="py-1 px-3 border-b text-left bg-gray-100 italic text-gray-500"
                              title={referenceTooltip}
                            >
                              <span style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                {value}
                              </span>
                              <span style={{ marginLeft: 4 }} title={referenceTooltip}>
                                🔒
                              </span>
                            </td>
                          );
                        }
                        // Angle field editable in core tab
                        if (col.key === 'angle' && activeTab === 'core') {
                          return marker.coreLocked ? (
                            <td
                              key={col.key}
                              className="py-1 px-3 border-b text-left text-gray-500 italic"
                            >
                              {value ?? 0}
                            </td>
                          ) : (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="360"
                                value={value ?? 0}
                                onChange={(e) =>
                                  handleFieldChange(
                                    marker.id,
                                    col.key,
                                    e.target.value === '' ? 0 : parseFloat(e.target.value),
                                  )
                                }
                                className="w-full bg-white border rounded px-2 py-1"
                              />
                            </td>
                          );
                        }
                        // Rectangle field editable in core tab
                        if (col.key === 'rectangle' && activeTab === 'core') {
                          return marker.coreLocked ? (
                            <td
                              key={col.key}
                              className="py-1 px-3 border-b text-left text-gray-500 italic"
                            >
                              {Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}
                            </td>
                          ) : (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <input
                                type="text"
                                value={
                                  Array.isArray(value)
                                    ? value.join(', ')
                                    : value === null
                                      ? ''
                                      : JSON.stringify(value)
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.trim();
                                  if (raw === '') {
                                    handleFieldChange(marker.id, col.key, null);
                                  } else {
                                    const arr = raw
                                      .split(',')
                                      .map((v) => v.trim())
                                      .map((v) => (v === '' ? 0 : Number(v)));
                                    handleFieldChange(marker.id, col.key, arr);
                                  }
                                }}
                                className="w-full bg-white border rounded px-2 py-1"
                              />
                            </td>
                          );
                        }
                        const isAppearanceUnlocked =
                          activeTab === 'appearance'
                            ? !marker.appearanceLocked
                            : !marker.coreLocked;
                        if (isAppearanceUnlocked) {
                          if (col.key === 'iconUrl') {
                            const iconPath = getIconPath(value);
                            return (
                              <td
                                key={col.key}
                                className="py-1 px-3 border-b text-left relative"
                                style={cellStyle}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <img
                                    src={iconPath}
                                    alt="icon"
                                    width={24}
                                    height={24}
                                    style={{
                                      cursor: 'pointer',
                                      border: '2px solid #eee',
                                      borderRadius: 4,
                                    }}
                                    onClick={() =>
                                      setIconPopover({ open: true, markerId: marker.id })
                                    }
                                    title="Click to change icon"
                                  />
                                  {/* <span style={{ fontSize: 12, color: '#888' }}>Change</span> */}
                                </div>
                                {iconPopover.open && iconPopover.markerId === marker.id && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 32,
                                      left: 0,
                                      zIndex: 100,
                                      background: '#fff',
                                      border: '1px solid #ddd',
                                      borderRadius: 8,
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                      padding: 12,
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(4, 40px)',
                                      gap: 10,
                                    }}
                                    onMouseLeave={() =>
                                      setIconPopover({ open: false, markerId: null })
                                    }
                                  >
                                    {ICON_OPTIONS.map((iconFile) => (
                                      <img
                                        key={iconFile}
                                        src={getIconPath(iconFile)}
                                        alt={iconFile.replace('.svg', '')}
                                        width={32}
                                        height={32}
                                        style={{
                                          cursor: 'pointer',
                                          border:
                                            value === iconFile
                                              ? '2px solid #1976d2'
                                              : '2px solid #eee',
                                          borderRadius: 4,
                                          background:
                                            value === iconFile ? '#e3f2fd' : 'transparent',
                                        }}
                                        title={iconFile
                                          .replace('glyph-marker-icon-', '')
                                          .replace('.svg', '')}
                                        onClick={() => {
                                          setIconPopover({ open: false, markerId: null });
                                          handleFieldChange(marker.id, 'iconUrl', iconFile);
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'logo' && value) {
                            const logoPath = getLogoPath(value);
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <img src={logoPath} alt="logo" width={24} height={24} />{' '}
                              </td>
                            );
                          }
                          if (col.key === 'iconSize' && activeTab === 'appearance') {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <input
                                  type="text"
                                  value={iconSizeInputs[marker.id] ?? ''}
                                  onChange={(e) => {
                                    setIconSizeInputs((prev) => ({
                                      ...prev,
                                      [marker.id]: e.target.value,
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val === '') {
                                      handleFieldChange(marker.id, 'iconSize', undefined);
                                    } else {
                                      const parts = val
                                        .split(',')
                                        .map((v) => v.trim())
                                        .filter((v) => v !== '');
                                      if (parts.length === 1) {
                                        const width = parseInt(parts[0], 10);
                                        if (!isNaN(width) && width > 0) {
                                          const height = Math.round(width * 1.64);
                                          handleFieldChange(marker.id, 'iconSize', [width, height]);
                                        }
                                      } else if (parts.length === 2) {
                                        const arr = parts.map((v) => parseInt(v, 10));
                                        if (
                                          !isNaN(arr[0]) &&
                                          !isNaN(arr[1]) &&
                                          arr[0] > 0 &&
                                          arr[1] > 0
                                        ) {
                                          handleFieldChange(marker.id, 'iconSize', arr);
                                        }
                                      }
                                    }
                                  }}
                                  placeholder="width[,height]"
                                  className="w-full bg-white border rounded px-2 py-1"
                                />
                              </td>
                            );
                          }
                          if (Array.isArray(value)) {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <input
                                  type="text"
                                  value={value.join(', ')}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      marker.id,
                                      col.key,
                                      e.target.value.split(',').map((v) => v.trim()),
                                    )
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                />{' '}
                              </td>
                            );
                          }
                          if (typeof value === 'object' && value !== null) {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <input
                                  type="text"
                                  value={JSON.stringify(value)}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      marker.id,
                                      col.key,
                                      JSON.parse(e.target.value),
                                    )
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                />{' '}
                              </td>
                            );
                          }
                          if (typeof value === 'boolean') {
                            return (
                              <td key={col.key} className="py-1 px-3 border-b text-left">
                                <select
                                  value={value ? 'true' : 'false'}
                                  onChange={(e) =>
                                    handleFieldChange(marker.id, col.key, e.target.value === 'true')
                                  }
                                  className="w-full bg-white border rounded px-2 py-1"
                                >
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              </td>
                            );
                          }
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <input
                                type="text"
                                value={value ?? ''}
                                onChange={(e) =>
                                  handleFieldChange(marker.id, col.key, e.target.value)
                                }
                                className="w-full bg-white border rounded px-2 py-1"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'iconUrl' && value) {
                          const iconPath = getIconPath(value);
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <img src={iconPath} alt="icon" width={24} height={24} />{' '}
                            </td>
                          );
                        }
                        if (col.key === 'logo' && value) {
                          const logoPath = getLogoPath(value);
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              <img src={logoPath} alt="logo" width={24} height={24} />{' '}
                            </td>
                          );
                        }
                        if (Array.isArray(value)) {
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              {value.join(', ')}
                            </td>
                          );
                        }
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <td key={col.key} className="py-1 px-3 border-b text-left">
                              {JSON.stringify(value)}
                            </td>
                          );
                        }
                        if (typeof value === 'boolean') {
                          return (
                            <td key={col.key} className="py-2 px-3 border-b text-left">
                              {value ? 'Yes' : 'No'}
                            </td>
                          );
                        }
                        return (
                          <td key={col.key} className="py-2 px-3 border-b text-left">
                            {value}
                          </td>
                        );
                      })}
                      <td
                        className="py-2 px-3 border-b text-right"
                        style={{
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          minWidth: '90px',
                          width: '90px',
                          maxWidth: '120px',
                        }}
                      >
                        <div className="flex justify-center p-0">
                          <button
                            onClick={() => toggleLock(marker.id)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition flex items-center justify-center"
                            title={
                              activeTab === 'appearance'
                                ? marker.appearanceLocked
                                  ? 'Unlock rectangle/rotation'
                                  : 'Lock rectangle/rotation'
                                : activeTab === 'content'
                                  ? marker.contentLocked
                                    ? 'Unlock content'
                                    : 'Lock content'
                                  : activeTab === 'admin'
                                    ? marker.adminLocked
                                      ? 'Unlock admin'
                                      : 'Lock admin'
                                    : marker.coreLocked
                                      ? 'Unlock core'
                                      : 'Lock core'
                            }
                          >
                            {activeTab === 'appearance' ? (
                              marker.appearanceLocked ? (
                                <Icon path={mdiLock} size={0.8} />
                              ) : (
                                <Icon path={mdiLockOpenVariant} size={0.8} />
                              )
                            ) : activeTab === 'content' ? (
                              marker.contentLocked ? (
                                <Icon path={mdiLock} size={0.8} />
                              ) : (
                                <Icon path={mdiLockOpenVariant} size={0.8} />
                              )
                            ) : activeTab === 'admin' ? (
                              marker.adminLocked ? (
                                <Icon path={mdiLock} size={0.8} />
                              ) : (
                                <Icon path={mdiLockOpenVariant} size={0.8} />
                              )
                            ) : marker.coreLocked ? (
                              <Icon path={mdiLock} size={0.8} />
                            ) : (
                              <Icon path={mdiLockOpenVariant} size={0.8} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
