
import React, { useEffect, useState } from 'react';

const MARKER_JSON_PATH = '/marker-template.json';

const TABS = [
  { key: 'core', label: 'Core' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'content', label: 'Content' },
  { key: 'admin', label: 'Admin-only' },
];

const COLUMNS = {
  core: [
    { key: 'id', label: 'ID' },
    { key: 'position', label: 'Position' },
  ],
  appearance: [
    { key: 'iconUrl', label: 'Icon' },
    { key: 'iconSize', label: 'Icon Size' },
    { key: 'iconColor', label: 'Icon Color' },
    { key: 'glyph', label: 'Glyph' },
    { key: 'glyphColor', label: 'Glyph Color' },
    { key: 'glyphSize', label: 'Glyph Size' },
    { key: 'glyphAnchor', label: 'Glyph Anchor' },
    { key: 'rectangle', label: 'Rectangle' },
    { key: 'angle', label: 'Angle' },
  ],
  content: [
    { key: 'boothNumber', label: 'Booth #' },
    { key: 'name', label: 'Name' },
    { key: 'logo', label: 'Logo' },
    { key: 'website', label: 'Website' },
    { key: 'info', label: 'Info' },
  ],
  admin: [
    { key: 'locked', label: 'Locked' },
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

export default function MarkerTable() {
  const [marker, setMarker] = useState(null);
  const [activeTab, setActiveTab] = useState('core');

  useEffect(() => {
    fetch(MARKER_JSON_PATH)
      .then(res => res.json())
      .then(data => setMarker(data));
  }, []);

  if (!marker) return <div>Loading marker data...</div>;

  return (
  <div className="marker-table-container" style={{ width: '100%', margin: '2rem auto', textAlign: 'center' }}>
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
      <table className="min-w-full border" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {COLUMNS[activeTab].map(col => (
              <th key={col.key} style={{ minWidth: 120 }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {COLUMNS[activeTab].map(col => {
              let value = marker[col.key];
              if (col.key === 'iconUrl') {
                return (
                  <td key={col.key}>
                    <img src={value} alt="icon" width={24} height={24} />
                  </td>
                );
              }
              if (col.key === 'logo') {
                return (
                  <td key={col.key}>
                    <img src={value} alt="logo" width={24} height={24} />
                  </td>
                );
              }
              if (col.key === 'position' && Array.isArray(value)) {
                return <td key={col.key}>{value.join(', ')}</td>;
              }
              if (col.key === 'iconSize' && Array.isArray(value)) {
                return <td key={col.key}>{value.join(' x ')}</td>;
              }
              if (col.key === 'glyphAnchor' && Array.isArray(value)) {
                return <td key={col.key}>{value.join(', ')}</td>;
              }
              if (col.key === 'rectangle' && value && typeof value === 'object') {
                return <td key={col.key}>{`W:${value.width}, H:${value.height}`}</td>;
              }
              if (typeof value === 'boolean') {
                return <td key={col.key}>{value ? 'Yes' : 'No'}</td>;
              }
              return <td key={col.key}>{value}</td>;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
