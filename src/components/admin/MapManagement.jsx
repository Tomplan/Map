import React, { useState, useMemo } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify, mdiLock, mdiLockOpenVariant, mdiContentSave, mdiClose } from '@mdi/js';
import ProtectedSection from '../ProtectedSection';
import { getIconPath } from '../../utils/getIconPath';
import { getLogoPath } from '../../utils/getLogoPath';
import { ICON_OPTIONS } from '../../config/markerTabsConfig';

/**
 * MapManagement - Unified interface for managing marker positions, styling, and content
 * System Managers only - merges Core/Appearance/Content tabs
 */
export default function MapManagement({ markersState, setMarkersState, selectedYear }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  // Filter markers by search term
  const filteredMarkers = useMemo(() => {
    if (!markersState) return [];

    return markersState.filter((marker) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        marker.id.toString().includes(searchLower) ||
        marker.glyph?.toLowerCase().includes(searchLower) ||
        marker.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [markersState, searchTerm]);

  // Get selected marker
  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null;
    return markersState?.find((m) => m.id === selectedMarkerId);
  }, [selectedMarkerId, markersState]);

  // Handle marker selection
  const handleSelectMarker = (marker) => {
    setSelectedMarkerId(marker.id);
    setEditMode(false);
  };

  // Start editing
  const handleStartEdit = () => {
    if (!selectedMarker) return;
    setEditData({ ...selectedMarker });
    setEditMode(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditData(null);
    setEditMode(false);
  };

  // Save changes
  const handleSave = () => {
    if (!editData) return;

    setMarkersState((prev) =>
      prev.map((m) => (m.id === editData.id ? { ...m, ...editData } : m))
    );

    // TODO: Save to Supabase
    console.log('Saving marker:', editData);

    setEditMode(false);
    setEditData(null);
  };

  // Update edit data
  const handleFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const isSpecialMarker = selectedMarker && selectedMarker.id >= 1000;
  const isBoothMarker = selectedMarker && selectedMarker.id < 1000;

  return (
    <ProtectedSection requiredRole={['super_admin', 'system_manager']}>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Map Management</h1>
          <p className="text-gray-600 mb-4">
            Manage marker positions, styling, and special marker content
          </p>

          {/* Search */}
          <div className="relative">
            <Icon
              path={mdiMagnify}
              size={1}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by ID, booth label, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex h-[calc(100vh-280px)]">
          {/* LEFT: Marker List */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            <div className="p-2">
              {filteredMarkers.map((marker) => {
                const isSelected = marker.id === selectedMarkerId;
                const isSpecial = marker.id >= 1000;

                return (
                  <button
                    key={marker.id}
                    onClick={() => handleSelectMarker(marker)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {marker.iconUrl && (
                        <img
                          src={getIconPath(marker.iconUrl)}
                          alt="icon"
                          className="w-6 h-6"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {marker.glyph || `Marker ${marker.id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {marker.id} {isSpecial && '(Special)'}
                        </div>
                        {marker.name && (
                          <div className="text-xs text-gray-600 truncate">
                            {marker.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Detail/Edit Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedMarker ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a marker to view details
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedMarker.glyph || `Marker ${selectedMarker.id}`}
                    </h2>
                    <p className="text-sm text-gray-600">
                      ID: {selectedMarker.id}
                      {isSpecialMarker && ' (Special Marker)'}
                      {isBoothMarker && ' (Booth - Content managed via Companies/Assignments)'}
                    </p>
                  </div>
                  {!editMode && (
                    <button
                      onClick={handleStartEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editMode ? (
                  <EditPanel
                    marker={editData}
                    isSpecialMarker={isSpecialMarker}
                    isBoothMarker={isBoothMarker}
                    onChange={handleFieldChange}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <ViewPanel marker={selectedMarker} isSpecialMarker={isSpecialMarker} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedSection>
  );
}

/** View Panel - Read-only display */
function ViewPanel({ marker, isSpecialMarker }) {
  return (
    <div className="space-y-6">
      {/* Position & Structure */}
      <Section title="Position & Structure">
        <Field label="Latitude" value={marker.lat} />
        <Field label="Longitude" value={marker.lng} />
        <Field label="Rectangle" value={JSON.stringify(marker.rectangle)} />
        <Field label="Angle" value={marker.angle || 0} />
      </Section>

      {/* Visual Styling */}
      <Section title="Visual Styling">
        <Field label="Icon">
          {marker.iconUrl && (
            <img src={getIconPath(marker.iconUrl)} alt="icon" className="w-8 h-8" />
          )}
        </Field>
        <Field label="Icon Size" value={JSON.stringify(marker.iconSize)} />
        <Field label="Glyph (Booth Label)" value={marker.glyph} />
        <Field label="Glyph Color" value={marker.glyphColor} />
        <Field label="Glyph Size" value={marker.glyphSize} />
      </Section>

      {/* Content (Special Markers Only) */}
      {isSpecialMarker && (
        <Section title="Content (Special Marker)">
          <Field label="Name" value={marker.name} />
          <Field label="Logo">
            {marker.logo && (
              <img src={getLogoPath(marker.logo)} alt="logo" className="w-12 h-12" />
            )}
          </Field>
          <Field label="Website" value={marker.website} />
          <Field label="Info" value={marker.info} />
        </Section>
      )}
    </div>
  );
}

/** Edit Panel - Editable fields */
function EditPanel({ marker, isSpecialMarker, isBoothMarker, onChange, onSave, onCancel }) {
  return (
    <div className="space-y-6">
      {/* Position & Structure */}
      <Section title="Position & Structure">
        <InputField label="Latitude" type="number" step="0.0001" value={marker.lat} onChange={(v) => onChange('lat', parseFloat(v))} />
        <InputField label="Longitude" type="number" step="0.0001" value={marker.lng} onChange={(v) => onChange('lng', parseFloat(v))} />
        <InputField label="Angle" type="number" step="0.1" value={marker.angle || 0} onChange={(v) => onChange('angle', parseFloat(v))} />
      </Section>

      {/* Visual Styling */}
      <Section title="Visual Styling">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {ICON_OPTIONS.map((iconFile) => (
              <button
                key={iconFile}
                onClick={() => onChange('iconUrl', iconFile)}
                className={`p-2 border-2 rounded-lg transition-all ${
                  marker.iconUrl === iconFile
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img src={getIconPath(iconFile)} alt={iconFile} className="w-8 h-8" />
              </button>
            ))}
          </div>
        </div>
        <InputField label="Glyph (Booth Label)" value={marker.glyph} onChange={(v) => onChange('glyph', v)} />
        <InputField label="Glyph Color" type="color" value={marker.glyphColor} onChange={(v) => onChange('glyphColor', v)} />
      </Section>

      {/* Content (Special Markers Only) */}
      {isSpecialMarker && (
        <Section title="Content (Special Marker)">
          <InputField label="Name" value={marker.name} onChange={(v) => onChange('name', v)} />
          <InputField label="Logo URL" value={marker.logo} onChange={(v) => onChange('logo', v)} />
          <InputField label="Website" value={marker.website} onChange={(v) => onChange('website', v)} />
          <TextAreaField label="Info" value={marker.info} onChange={(v) => onChange('info', v)} />
        </Section>
      )}

      {isBoothMarker && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a booth marker. Content (name, logo, website, info) is managed via the Companies and Assignments tabs.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon path={mdiContentSave} size={0.9} />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <Icon path={mdiClose} size={0.9} />
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Helper Components */
function Section({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, children }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      {children || <div className="text-gray-900">{value || '—'}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        {...props}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
