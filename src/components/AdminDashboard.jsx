import { useState, useEffect } from 'react';
import NumericArrayInputs from './NumericArrayInputs';
import { supabase } from '../supabaseClient';
import EventMap from './EventMap/EventMap';
import CompaniesTab from './admin/CompaniesTab';
import EventSubscriptionsTab from './admin/EventSubscriptionsTab';
import AssignmentsTab from './admin/AssignmentsTab';
import Icon from '@mdi/react';
import { mdiViewDashboard, mdiLock, mdiLockOpenVariant } from '@mdi/js';
import { getIconPath } from '../utils/getIconPath';
import { getLogoPath } from '../utils/getLogoPath';
import { useMarkerFieldHandler } from '../hooks/useMarkerFieldHandler';
import { useMarkerSorting } from '../hooks/useMarkerSorting';
import { TABS, COLUMNS, ICON_OPTIONS, ICON_PATH_PREFIX } from '../config/markerTabsConfig';

export default function AdminDashboard({
  markersState,
  setMarkersState,
  updateMarker,
  isAdminView,
  selectedYear,
  setSelectedYear,
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

  // Use field handler hook
  const handleFieldChange = useMarkerFieldHandler(setMarkersState);

  const [showDashboard, setShowDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState('core');

  // Current year for year selector range
  const currentYear = new Date().getFullYear();

  // Use sorting hook
  const { sortState, sortedMarkers, handleSort } = useMarkerSorting(markersState, activeTab);
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Lock/unlock marker for current tab
  async function toggleLock(id) {
    // Get current marker state before updating
    const currentMarker = markersState.find((m) => m.id === id);
    if (!currentMarker) return;

    // Determine which lock field to update
    let lockField, newValue, table;
    if (activeTab === 'appearance') {
      lockField = 'appearanceLocked';
      newValue = !currentMarker.appearanceLocked;
      table = 'Markers_Appearance';
    } else if (activeTab === 'content') {
      lockField = 'contentLocked';
      newValue = !currentMarker.contentLocked;
      table = 'Markers_Content';
    } else if (activeTab === 'admin') {
      lockField = 'adminLocked';
      newValue = !currentMarker.adminLocked;
      table = 'Markers_Admin';
    } else {
      lockField = 'coreLocked';
      newValue = !currentMarker.coreLocked;
      table = 'Markers_Core';
    }

    // Update database first
    const { error } = await supabase
      .from(table)
      .update({ [lockField]: newValue })
      .eq('id', id);

    if (error) {
      console.error(`Failed to update ${lockField}:`, error);
      alert(`Error updating lock: ${error.message}`);
      return;
    }

    // Only update local state after successful database update
    setMarkersState((prev) => {
      return prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, [lockField]: newValue };
      });
    });
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

  return (
    <div className="relative w-full h-screen">
      {/* Map fills the whole screen */}
      <div className="absolute inset-0 w-full h-full">
        {/* Dashboard button now inside map container, top-left */}
        <button
          className="fixed top-2 right-20 z-50 bg-white rounded-full shadow-md p-3 flex items-center gap-2 hover:bg-gray-100 focus:outline-none print-hide"
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
            style={{ maxHeight: '100svh', overflowY: 'auto', opacity: 0.9 }}
          >
            {/* Header with tabs and year selector */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Tabs */}
              <div style={{ textAlign: 'left' }}>
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

              {/* Global Year Selector - show for all tabs except Companies */}
              {activeTab !== 'companies' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#1976d2' }}>Event Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '2px solid #1976d2',
                      borderRadius: 4,
                      background: 'white',
                      color: '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Render new tab components */}
              {activeTab === 'companies' ? (
                <CompaniesTab />
              ) : activeTab === 'eventSubscriptions' ? (
                <EventSubscriptionsTab selectedYear={selectedYear} />
              ) : activeTab === 'assignments' ? (
                <AssignmentsTab selectedYear={selectedYear} />
              ) : (
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
                      // Set specific column widths
                      const thStyle = {
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        background: '#f3f4f6',
                        minWidth:
                          col.key === 'id'
                            ? 80
                            : col.key === 'iconUrl'
                                ? 40
                                : col.key === 'glyph'
                                    ? 100
                                    : undefined,
                        width:
                          col.key === 'id'
                            ? 80
                            : col.key === 'iconUrl'
                                ? 40
                                : col.key === 'glyph'
                                    ? 100
                                    : undefined,
                        maxWidth:
                          col.key === 'id'
                            ? 80
                            : col.key === 'iconUrl'
                                ? 40
                                : col.key === 'glyph'
                                    ? 100
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
                          col.key === 'name' &&
                          activeTab !== 'content'
                        ) {
                          isReference = true;
                          referenceTooltip =
                            'Reference field from Markers_Content; cannot be edited here.';
                        }
                        // In Content tab, booth markers (< 1000) show company data from assignments (read-only)
                        if (activeTab === 'content' && marker.id < 1000) {
                          isReference = true;
                          referenceTooltip =
                            'Company booth - managed via Companies and Assignments tabs. Only special markers (ID >= 1000) are editable here.';
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
                        // Content tab: editable only for special markers (id >= 1000) and if contentLocked is false
                        // Markers < 1000 are company booths managed via Companies/Assignments tables
                        if (activeTab === 'content' && !marker.contentLocked && marker.id >= 1000) {
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
