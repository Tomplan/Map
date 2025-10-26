import React, { useState, useEffect, useMemo } from 'react';
import EventMap from './EventMap';
import * as XLSX from 'xlsx';
import { MdDashboard } from 'react-icons/md';
import { supabase } from '../supabaseClient';
import AdminLogin from './AdminLogin';
import BrandingSettings from './BrandingSettings';
import { getIconPath } from '../utils/getIconPath';
import { getLogoPath } from '../utils/getLogoPath';

export default function AdminDashboard() {
  const [showDashboard, setShowDashboard] = useState(false);
  // Branding settings save handler
  const handleBrandingChange = async (newSettings) => {
    await supabase
      .from('Branding')
      .upsert({ id: 1, ...newSettings });
  };
  const TAB_TABLES = useMemo(() => ({
    core: 'Markers_Core',
    appearance: 'Markers_Appearance',
    content: 'Markers_Content',
    admin: 'Markers_Admin',
  }), []);
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
      { key: 'position', label: 'Position' }
    ],
    appearance: [
      { key: 'id', label: 'ID' },
      { key: 'boothNumber', label: 'Booth #' },
      { key: 'name', label: 'Name' },
      { key: 'iconUrl', label: 'Icon' },
      { key: 'iconSize', label: 'Icon Size' },
      { key: 'iconColor', label: 'Icon Color' },
      { key: 'className', label: 'Class Name' },
      { key: 'prefix', label: 'Prefix' },
      { key: 'glyph', label: 'Glyph' },
      { key: 'glyphColor', label: 'Glyph Color' },
      { key: 'glyphSize', label: 'Glyph Size' },
      { key: 'glyphAnchor', label: 'Glyph Anchor' },
      { key: 'rectangle', label: 'Rectangle' },
      { key: 'angle', label: 'Angle' }
    ],
    content: [
      { key: 'id', label: 'ID' },
      { key: 'boothNumber', label: 'Booth #' },
      { key: 'name', label: 'Name' },
      { key: 'logo', label: 'Logo' },
      { key: 'website', label: 'Website' },
      { key: 'info', label: 'Info' }
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
      { key: 'notes', label: 'Notes' }
    ],
  };
  const [activeTab, setActiveTab] = useState('core');
  // Sorting state: column and direction per tab
  const [sortState, setSortState] = useState({
    core: { column: 'id', direction: 'asc' },
    appearance: { column: 'id', direction: 'asc' },
    content: { column: 'id', direction: 'asc' },
    admin: { column: 'id', direction: 'asc' }
  });

  // Handle sort change
  function handleSort(tab, column) {
    setSortState(prev => {
      const current = prev[tab];
      // Toggle direction if same column, else default to asc
      const direction = current.column === column ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc';
      return { ...prev, [tab]: { column, direction } };
    });
  }
  // Auth state
  // Remove unused auth state

  // Remove unused auth effect

  // Tabbed marker data
  const [tabData, setTabData] = useState({ core: [], appearance: [], content: [], admin: [] });
  useEffect(() => {
    async function fetchAllTabs() {
      const results = {};
      for (const tab of Object.keys(TAB_TABLES)) {
        const { data } = await supabase.from(TAB_TABLES[tab]).select('*');
        results[tab] = data || [];
      }
      setTabData(results);
    }
    fetchAllTabs();
  }, [TAB_TABLES]);
    // Sort markers for current tab before rendering
    const sortedMarkers = useMemo(() => {
      const tab = activeTab;
      const markers = tabData[tab] || [];
      const { column, direction } = sortState[tab];
      // Reference fields: id, boothNumber, name
      let getValue = m => m[column];
      if (column === 'id') {
        getValue = m => {
          const coreMarker = tabData.core.find(cm => cm.id === m.id);
          return coreMarker ? coreMarker.id : '';
        };
      }
      if (column === 'boothNumber' || column === 'name') {
        getValue = m => {
          const contentMarker = tabData.content.find(cm => cm.id === m.id);
          return contentMarker ? contentMarker[column] : '';
        };
      }
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
    }, [tabData, activeTab, sortState]);
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Lock/unlock marker for current tab
  async function toggleLock(id) {
    const tabMarkers = tabData[activeTab];
    const updatedMarkers = tabMarkers.map(m => m.id === id ? { ...m, locked: !m.locked } : m);
    setTabData({ ...tabData, [activeTab]: updatedMarkers });
    // Auto-save to relevant table
    const changed = updatedMarkers.find(m => m.id === id);
    if (changed) {
      await supabase
        .from(TAB_TABLES[activeTab])
        .update({ locked: changed.locked })
        .eq('id', id);
    }
  }

  // Undo/redo logic for tabbed data
  function undo() {
    if (undoStack.length === 0) return;
    setRedoStack([tabData[activeTab], ...redoStack]);
    setTabData({ ...tabData, [activeTab]: undoStack[undoStack.length - 1] });
    setUndoStack(undoStack.slice(0, -1));
  }
  function redo() {
    if (redoStack.length === 0) return;
    setUndoStack([...undoStack, tabData[activeTab]]);
    setTabData({ ...tabData, [activeTab]: redoStack[0] });
    setRedoStack(redoStack.slice(1));
  }

  // Select marker for editing
  function selectMarker(id) {
    setSelected(id);
  }

  // Export current tab markers as JSON
  function exportMarkers() {
    const dataStr = JSON.stringify(tabData[activeTab], null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markers-${activeTab}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }




  // Branding state for live sync
  const [branding, setBranding] = useState({ logo: '', themeColor: '#2d3748', fontFamily: 'Montserrat, sans-serif', eventName: 'Event Map', id: 1 });

  // Fetch initial branding data
  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase
        .from('Branding')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) setBranding(data);
    }
    fetchBranding();
    // Subscribe to realtime updates
    const channel = supabase
      .channel('branding-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Branding',
        filter: 'id=eq.1',
      }, payload => {
        if (payload.new) setBranding(payload.new);
      })
      .subscribe();
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* Dashboard button at top */}
      <button
  className="fixed top-4 right-4 z-50 bg-white rounded-full shadow-md p-3 flex items-center gap-2 hover:bg-gray-100 focus:outline-none"
        aria-label="Toggle dashboard"
        onClick={() => setShowDashboard((v) => !v)}
      >
  <MdDashboard size={24} color="#1976d2" />
  <span className="font-semibold" style={{ color: '#1976d2' }}>Dashboard</span>
      </button>
      {/* Map fills the whole screen */}
      <div className="absolute inset-0 w-full h-full">
        <EventMap />
      </div>
      {/* Dashboard panel overlays map when open */}
      {showDashboard && (
          <div className="absolute inset-0 left-4 right-4 z-40 flex justify-start items-start pt-20">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Marker tables for each tab */}
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                {TABS.map(tab => (
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
              <table className="w-full border border-gray-300 rounded overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    {COLUMNS[activeTab].map(col => {
                      // Sorting indicator
                      const isSorted = sortState[activeTab].column === col.key;
                      const arrow = isSorted ? (sortState[activeTab].direction === 'asc' ? '▲' : '▼') : '';
                      // For core tab, make id column small
                      const thStyle =
                        activeTab === 'core' && col.key === 'id'
                          ? { minWidth: 40, width: 40, maxWidth: 40, cursor: 'pointer' }
                          : col.key === 'boothNumber'
                          ? { minWidth: 120, width: 120, maxWidth: 120, cursor: 'pointer' }
                          : { cursor: 'pointer' };
                      return (
                        <th
                          key={col.key}
                          className="py-2 px-3 border-b text-left select-none hover:bg-blue-50"
                          style={thStyle}
                          onClick={() => handleSort(activeTab, col.key)}
                          title={`Sort by ${col.label}`}
                        >
                          <span style={{ userSelect: 'none' }}>{col.label} {arrow}</span>
                        </th>
                      );
                    })}
                    <th className="py-2 px-3 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMarkers.map(marker => (
                    <tr key={marker.id} className={selected === marker.id ? 'bg-blue-50 text-gray-900' : 'bg-white text-gray-900'}>
                      {COLUMNS[activeTab].map(col => {
                        let value = marker[col.key];
                        // Reference field logic
                        let isReference = false;
                        let referenceTooltip = '';
                        // id is only editable in core
                        if (col.key === 'id') {
                          const coreMarker = tabData.core.find(m => m.id === marker.id);
                          value = coreMarker ? coreMarker.id : '';
                          isReference = activeTab !== 'core';
                          referenceTooltip = 'Reference field from Markers_Core; cannot be edited here.';
                        }
                        // boothNumber and name are only editable in content
                        if (col.key === 'boothNumber' || col.key === 'name') {
                          const contentMarker = tabData.content.find(m => m.id === marker.id);
                          value = contentMarker ? contentMarker[col.key] : '';
                          isReference = activeTab !== 'content';
                          referenceTooltip = 'Reference field from Markers_Content; cannot be edited here.';
                        }
                        if (isReference) {
                          return (
                            <td key={col.key} className="py-2 px-3 border-b text-left bg-gray-100 italic text-gray-500" title={referenceTooltip}>
                              <span style={{ pointerEvents: 'none', userSelect: 'none' }}>{value}</span>
                              <span style={{ marginLeft: 4 }} title={referenceTooltip}>🔒</span>
                            </td>
                          );
                        }
                        if (col.key === 'iconUrl' && value) {
                          const iconPath = getIconPath(value);
                          return <td key={col.key} className="py-2 px-3 border-b text-left"><img src={iconPath} alt="icon" width={24} height={24} /> </td>;
                        }
                        if (col.key === 'logo' && value) {
                          const logoPath = getLogoPath(value);
                          return <td key={col.key} className="py-2 px-3 border-b text-left"><img src={logoPath} alt="logo" width={24} height={24} /> </td>;
                        }
                        if (Array.isArray(value)) {
                          return <td key={col.key} className="py-2 px-3 border-b text-left">{value.join(', ')}</td>;
                        }
                        if (typeof value === 'object' && value !== null) {
                          return <td key={col.key} className="py-2 px-3 border-b text-left">{JSON.stringify(value)}</td>;
                        }
                        if (typeof value === 'boolean') {
                          return <td key={col.key} className="py-2 px-3 border-b text-left">{value ? 'Yes' : 'No'}</td>;
                        }
                        return <td key={col.key} className="py-2 px-3 border-b text-left">{value}</td>;
                      })}
                      <td className="py-2 px-3 border-b">
                        <button onClick={() => toggleLock(marker.id)} className="px-2 py-1 text-xs bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition">
                          {marker.locked ? 'Unlock' : 'Lock'}
                        </button>
                        <button onClick={() => selectMarker(marker.id)} className="ml-2 px-2 py-1 text-xs bg-yellow-300 text-gray-900 rounded hover:bg-yellow-400 transition">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
}


