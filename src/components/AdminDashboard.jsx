import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import AdminLogin from './AdminLogin';
import BrandingSettings from './BrandingSettings';


export default function AdminDashboard() {
  // Tabbed dashboard structure
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
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-save handler for branding settings
  const handleBrandingChange = async (newSettings) => {
    await supabase
      .from('Branding')
      .upsert({ id: 1, ...newSettings });
  };


  // Export all data (branding + marker tables) as Excel file
  async function exportData() {
    // Fetch branding
    const { data: branding } = await supabase
      .from('Branding')
      .select('*')
      .eq('id', 1)
      .single();
    // Fetch marker tables
    const { data: core } = await supabase.from('Markers_Core').select('*');
    const { data: appearance } = await supabase.from('Markers_Appearance').select('*');
    const { data: content } = await supabase.from('Markers_Content').select('*');
    const { data: admin } = await supabase.from('Markers_Admin').select('*');
    // Prepare sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([branding]), 'Branding');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(core || []), 'Markers_Core');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(appearance || []), 'Markers_Appearance');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(content || []), 'Markers_Content');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(admin || []), 'Markers_Admin');
    // Export Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eventmap-backup.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button onClick={exportData} className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Export Data</button>
      <BrandingSettings onChange={handleBrandingChange} initialValues={branding} />
  <section className="p-6 bg-white rounded-lg shadow-lg w-full border border-gray-200" aria-label="Admin Dashboard">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Admin Dashboard</h2>
        <div className="flex gap-3 mb-6">
          <button onClick={undo} disabled={undoStack.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Undo</button>
          <button onClick={redo} disabled={redoStack.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Redo</button>
          <button onClick={exportMarkers} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Export JSON</button>
        </div>
        {/* Tabbed marker table */}
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
                // For core tab, make id column small
                if (activeTab === 'core' && col.key === 'id') {
                  return <th key={col.key} className="py-2 px-3 border-b text-left" style={{ minWidth: 40, width: 40, maxWidth: 40 }}>{col.label}</th>;
                }
                // For boothNumber column, set fixed width
                if (col.key === 'boothNumber') {
                  return <th key={col.key} className="py-2 px-3 border-b text-left" style={{ minWidth: 120, width: 120, maxWidth: 120 }}>{col.label}</th>;
                }
                return <th key={col.key} className="py-2 px-3 border-b text-left">{col.label}</th>;
              })}
              <th className="py-2 px-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tabData[activeTab].map(marker => (
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
                    return <td key={col.key} className="py-2 px-3 border-b text-left"><img src={value} alt="icon" width={24} height={24} /> </td>;
                  }
                  if (col.key === 'logo' && value) {
                    return <td key={col.key} className="py-2 px-3 border-b text-left"><img src={value} alt="logo" width={24} height={24} /> </td>;
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
        {selected && (
          <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <h3 className="font-bold mb-2 text-gray-900">Edit Marker #{selected}</h3>
            {/* Add marker editing UI here */}
            <button onClick={() => setSelected(null)} className="mt-2 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition">Close</button>
          </div>
        )}
      </section>
    </>
  );
}
