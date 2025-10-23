import React, { useState } from 'react';

// Basic admin dashboard for marker management
export default function AdminDashboard() {
  // Simulated marker data (replace with Supabase or API)
  const [markers, setMarkers] = useState([
    { id: 1, lat: 51.899, lng: 5.779, label: 'Main Stage', locked: false },
    { id: 2, lat: 51.898, lng: 5.780, label: 'Food Court', locked: false },
  ]);
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Lock/unlock marker
  function toggleLock(id) {
    setUndoStack([...undoStack, markers]);
    setMarkers(markers.map(m => m.id === id ? { ...m, locked: !m.locked } : m));
    setRedoStack([]);
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

  return (
    <section className="p-4 bg-gray-50 rounded shadow-md max-w-2xl mx-auto" aria-label="Admin Dashboard">
      <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={undo} disabled={undoStack.length === 0} className="px-3 py-1 bg-blue-100 rounded">Undo</button>
        <button onClick={redo} disabled={redoStack.length === 0} className="px-3 py-1 bg-blue-100 rounded">Redo</button>
        <button onClick={exportMarkers} className="px-3 py-1 bg-green-100 rounded">Export JSON</button>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>ID</th>
            <th>Label</th>
            <th>Lat</th>
            <th>Lng</th>
            <th>Locked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {markers.map(marker => (
            <tr key={marker.id} className={selected === marker.id ? 'bg-yellow-50' : ''}>
              <td>{marker.id}</td>
              <td>{marker.label}</td>
              <td>{marker.lat}</td>
              <td>{marker.lng}</td>
              <td>{marker.locked ? '🔒' : '🔓'}</td>
              <td>
                <button onClick={() => toggleLock(marker.id)} className="px-2 py-1 text-xs bg-gray-100 rounded">
                  {marker.locked ? 'Unlock' : 'Lock'}
                </button>
                <button onClick={() => selectMarker(marker.id)} className="ml-2 px-2 py-1 text-xs bg-yellow-100 rounded">
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div className="mt-4 p-2 border rounded bg-white">
          <h3 className="font-bold mb-2">Edit Marker #{selected}</h3>
          {/* Add marker editing UI here */}
          <button onClick={() => setSelected(null)} className="mt-2 px-3 py-1 bg-gray-200 rounded">Close</button>
        </div>
      )}
    </section>
  );
}
