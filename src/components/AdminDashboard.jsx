import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AdminLogin from './AdminLogin';
import BrandingSettings from './BrandingSettings';


export default function AdminDashboard() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Simulated marker data (replace with Supabase or API)
  const [markers, setMarkers] = useState([
    { id: 1, lat: 51.899, lng: 5.779, label: 'Main Stage', locked: false },
    { id: 2, lat: 51.898, lng: 5.780, label: 'Food Court', locked: false },
  ]);
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Lock/unlock marker
  async function toggleLock(id) {
    setUndoStack([...undoStack, markers]);
    const updatedMarkers = markers.map(m => m.id === id ? { ...m, locked: !m.locked } : m);
    setMarkers(updatedMarkers);
    setRedoStack([]);
    // Auto-save to Supabase
    const changed = updatedMarkers.find(m => m.id === id);
    if (changed) {
      await supabase
        .from('markers')
        .update({ locked: changed.locked })
        .eq('id', id);
    }
  }

  // Undo/redo logic
  function undo() {
    if (undoStack.length === 0) return;
    setRedoStack([markers, ...redoStack]);
    setMarkers(undoStack[undoStack.length - 1]);
    setUndoStack(undoStack.slice(0, -1));
  }
  function redo() {
    if (redoStack.length === 0) return;
    setUndoStack([...undoStack, markers]);
    setMarkers(redoStack[0]);
    setRedoStack(redoStack.slice(1));
  }

  // Select marker for editing
  function selectMarker(id) {
    setSelected(id);
  }

  // Export markers as JSON
  function exportMarkers() {
    const dataStr = JSON.stringify(markers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markers.json';
    a.click();
    URL.revokeObjectURL(url);
  }




  // Branding state for live sync
  const [branding, setBranding] = useState({ logo: '', themeColor: '#2d3748', fontFamily: 'Montserrat, sans-serif', eventName: 'Event Map', id: 1 });

  // Fetch initial branding data
  useEffect(() => {
    async function fetchBranding() {
      const { data, error } = await supabase
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

  return (
    <>
  <BrandingSettings onChange={handleBrandingChange} initialValues={branding} />
      <section className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto border border-gray-200" aria-label="Admin Dashboard">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Admin Dashboard</h2>
        <div className="flex gap-3 mb-6">
          <button onClick={undo} disabled={undoStack.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Undo</button>
          <button onClick={redo} disabled={redoStack.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Redo</button>
          <button onClick={exportMarkers} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Export JSON</button>
        </div>
        <table className="w-full border border-gray-300 rounded overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-gray-900">
              <th className="py-2 px-3 border-b">ID</th>
              <th className="py-2 px-3 border-b">Label</th>
              <th className="py-2 px-3 border-b">Lat</th>
              <th className="py-2 px-3 border-b">Lng</th>
              <th className="py-2 px-3 border-b">Locked</th>
              <th className="py-2 px-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {markers.map(marker => (
              <tr key={marker.id} className={selected === marker.id ? 'bg-blue-50 text-gray-900' : 'bg-white text-gray-900'}>
                <td className="py-2 px-3 border-b">{marker.id}</td>
                <td className="py-2 px-3 border-b">{marker.label}</td>
                <td className="py-2 px-3 border-b">{marker.lat}</td>
                <td className="py-2 px-3 border-b">{marker.lng}</td>
                <td className="py-2 px-3 border-b">{marker.locked ? '🔒' : '🔓'}</td>
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
