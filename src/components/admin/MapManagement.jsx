import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiMagnify, mdiLock, mdiLockOpenVariant, mdiContentSave, mdiClose, mdiChevronUp, mdiChevronDown } from '@mdi/js';
import ProtectedSection from '../ProtectedSection';
import { getIconPath } from '../../utils/getIconPath';
import { getLogoPath } from '../../utils/getLogoPath';
import { ICON_OPTIONS } from '../../config/markerTabsConfig';
import { supabase } from '../../supabaseClient';
import EventMap from '../EventMap/EventMap';
import { useDialog } from '../../contexts/DialogContext';

/**
 * MapManagement - Unified interface for managing marker positions, styling, and content
 * System Managers only - merges Core/Appearance/Content tabs
 * Features: Marker list, interactive map, and detail/edit panel
 */
export default function MapManagement({ markersState, setMarkersState, updateMarker, selectedYear }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
    const [sortBy, setSortBy] = useState('id'); // id, name, type
    const [sortDirection, setSortDirection] = useState('asc'); // asc, desc
  const [defaultMarkers, setDefaultMarkers] = useState([]); // Defaults for booth markers (IDs -1, -2)
  const { toastError } = useDialog();

  // Fetch default markers on mount
  useEffect(() => {
    async function fetchDefaults() {
      try {
        // Fetch both Core and Appearance data for defaults
        const [coreRes, appearanceRes] = await Promise.all([
          supabase.from('Markers_Core').select('*').in('id', [-1, -2]),
          supabase.from('Markers_Appearance').select('*').in('id', [-1, -2]),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;

        // Merge Core and Appearance data
        const merged = (coreRes.data || []).map(core => {
          const appearance = (appearanceRes.data || []).find(a => a.id === core.id) || {};
          return { ...core, ...appearance };
        });

        setDefaultMarkers(merged);
      } catch (error) {
        console.error('Error fetching default markers:', error);
      }
    }

    fetchDefaults();
  }, []);

  // Filter and sort markers (including defaults at the top)
  const filteredMarkers = useMemo(() => {
    if (!markersState) return defaultMarkers;

    // Filter regular markers by search term
    let filtered = markersState.filter((marker) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        marker.id.toString().includes(searchLower) ||
        marker.glyph?.toLowerCase().includes(searchLower) ||
        marker.name?.toLowerCase().includes(searchLower)
      );
    });

      // Sort regular markers
      const sorted = [...filtered].sort((a, b) => {
        let result = 0;
        switch (sortBy) {
          case 'id':
            result = a.id - b.id;
            break;
          case 'name':
            result = (a.glyph || a.name || '').localeCompare(b.glyph || b.name || '');
            break;
          case 'type':
            // Special markers (>= 1000) first, then booths
            if ((a.id >= 1000) !== (b.id >= 1000)) {
              result = a.id >= 1000 ? -1 : 1;
            } else {
              result = a.id - b.id;
            }
            break;
          default:
            result = a.id - b.id;
        }
        return sortDirection === 'desc' ? -result : result;
      });

    // If no search term, prepend defaults at the top (sorted by ID descending: -1, -2)
    if (!searchTerm) {
      const sortedDefaults = [...defaultMarkers].sort((a, b) => b.id - a.id);
      return [...sortedDefaults, ...sorted];
    }

    return sorted;
  }, [markersState, defaultMarkers, searchTerm, sortBy, sortDirection]);

  // Get selected marker (check both regular markers and defaults)
  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null;
    // Check defaults first
    const defaultMarker = defaultMarkers.find((m) => m.id === selectedMarkerId);
    if (defaultMarker) return defaultMarker;
    // Then check regular markers
    return markersState?.find((m) => m.id === selectedMarkerId);
  }, [selectedMarkerId, markersState, defaultMarkers]);

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
  const handleSave = async () => {
    if (!editData) return;

    // Check if this is a default marker
    const isDefault = editData.id === -1 || editData.id === -2;

    try {
      if (isDefault) {
        // Save defaults to both Core and Appearance tables
        const coreFields = {
          rectWidth: editData.rectWidth,
          rectHeight: editData.rectHeight,
        };

        const appearanceFields = {
          iconUrl: editData.iconUrl,
          iconSize: editData.iconSize,
          glyphColor: editData.glyphColor,
          glyphSize: editData.glyphSize,
        };

        // Update both tables
        const [coreRes, appearanceRes] = await Promise.all([
          supabase.from('Markers_Core').update(coreFields).eq('id', editData.id),
          supabase.from('Markers_Appearance').update(appearanceFields).eq('id', editData.id),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;

        // Reload defaults
        setDefaultMarkers(prev =>
          prev.map(m => (m.id === editData.id ? { ...m, ...editData } : m))
        );
      } else {
        // Save regular marker to local state
        setMarkersState((prev) =>
          prev.map((m) => (m.id === editData.id ? { ...m, ...editData } : m))
        );

        // Save to Supabase using updateMarker (automatically routes to correct tables)
        await updateMarker(editData.id, editData);
      }

      setEditMode(false);
      setEditData(null);
    } catch (error) {
      console.error('Error saving marker:', error);
      toastError('Failed to save marker. Please try again.');
    }
  };

  // Update edit data
  const handleFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const isDefaultMarker = selectedMarker && (selectedMarker.id === -1 || selectedMarker.id === -2);
  const isSpecialMarker = selectedMarker && selectedMarker.id >= 1000;
  const isBoothMarker = selectedMarker && selectedMarker.id > 0 && selectedMarker.id < 1000;

  return (
    <ProtectedSection requiredRole={['super_admin', 'system_manager']}>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          {/* Search and Sort */}
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Icon
                path={mdiMagnify}
                size={1}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('mapManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort - new layout */}
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white w-64">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 pl-3 pr-3 py-1.5 border-0 rounded-l-md bg-white text-gray-900 text-sm focus:ring-0 appearance-none"
                aria-label={t('mapManagement.sortBy')}
              >
                <option value="id">{t('mapManagement.sortId')}</option>
                <option value="name">{t('mapManagement.sortName')}</option>
                <option value="type">{t('mapManagement.sortType')}</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                aria-label={`Toggle sort direction to ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                className="px-2 py-1.5 border-l border-gray-300 text-gray-500 hover:bg-gray-50 rounded-r-md"
              >
                <Icon path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.8} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-150px)]">
          {/* LEFT: Marker List */}
          <div className="w-64 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-2">
              {filteredMarkers.map((marker) => {
                const isSelected = marker.id === selectedMarkerId;
                const isDefault = marker.id === -1 || marker.id === -2;
                const isSpecial = marker.id >= 1000;

                return (
                  <button
                    key={marker.id}
                    onClick={() => handleSelectMarker(marker)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : isDefault
                        ? 'bg-amber-50 border-2 border-amber-300 hover:bg-amber-100'
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
                          {isDefault
                            ? (marker.id === -1 ? 'Assigned Booth Default' : 'Unassigned Booth Default')
                            : marker.glyph || `Marker ${marker.id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {marker.id}
                          {isDefault && ' ⚙️ Global Default'}
                          {isSpecial && ' (Special)'}
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

          {/* CENTER: Map View */}
          <div className="flex-1 relative bg-gray-50">
            <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500">Loading map...</div>}>
              <EventMap
                isAdminView={true}
                markersState={markersState}
                updateMarker={updateMarker}
                selectedYear={selectedYear}
                selectedMarkerId={selectedMarkerId}
                onMarkerSelect={(id) => {
                  setSelectedMarkerId(id);
                  setEditMode(false);
                }}
              />
            </Suspense>
          </div>

          {/* RIGHT: Detail/Edit Panel */}
          <div className="w-96 border-l border-gray-200 overflow-y-auto p-6 flex-shrink-0">
            {!selectedMarker ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('mapManagement.selectMarker')}
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {isDefaultMarker
                        ? (selectedMarker.id === -1 ? 'Assigned Booth Default' : 'Unassigned Booth Default')
                        : selectedMarker.glyph || `Marker ${selectedMarker.id}`}
                    </h2>
                    <p className="text-sm text-gray-600">
                      ID: {selectedMarker.id}
                      {isDefaultMarker && ' ⚙️ Global Default for Booth Markers'}
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
                    isDefaultMarker={isDefaultMarker}
                    isSpecialMarker={isSpecialMarker}
                    isBoothMarker={isBoothMarker}
                    onChange={handleFieldChange}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <ViewPanel marker={selectedMarker} isSpecialMarker={isSpecialMarker} isDefaultMarker={isDefaultMarker} />
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
function ViewPanel({ marker, isSpecialMarker, isDefaultMarker }) {
  return (
    <div className="space-y-6">
      {isDefaultMarker && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">ℹ️ About Default Markers</h4>
          <p className="text-sm text-amber-800 mb-2">
            {marker.id === -1
              ? 'This defines the default appearance for booth markers (ID < 1000) that have a company assigned.'
              : 'This defines the default appearance for booth markers (ID < 1000) that have no company assigned.'}
          </p>
          <p className="text-sm text-amber-800">
            Individual booth markers can override these defaults by having their own values in the Appearance table.
          </p>
        </div>
      )}

      {/* Position & Structure */}
      {!isDefaultMarker && (
        <Section title="Position & Structure">
          <Field label="Latitude" value={marker.lat} />
          <Field label="Longitude" value={marker.lng} />
          <Field label="Rectangle" value={JSON.stringify(marker.rectangle)} />
          <Field label="Angle" value={marker.angle || 0} />
        </Section>
      )}

      {/* Visual Styling */}
      <Section title={isDefaultMarker ? "Default Visual Styling" : "Visual Styling"}>
        <Field label="Icon">
          {marker.iconUrl && (
            <img src={getIconPath(marker.iconUrl)} alt="icon" className="w-8 h-8" />
          )}
        </Field>
        <Field label="Icon Size" value={JSON.stringify(marker.iconSize)} />
        {!isDefaultMarker && <Field label="Glyph (Booth Label)" value={marker.glyph} />}
        <Field label="Glyph Color" value={marker.glyphColor} />
        <Field label="Glyph Size" value={marker.glyphSize} />
        {isDefaultMarker && (
          <>
            <Field label="Rectangle Width" value={marker.rectWidth} />
            <Field label="Rectangle Height" value={marker.rectHeight} />
          </>
        )}
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
function EditPanel({ marker, isDefaultMarker, isSpecialMarker, isBoothMarker, onChange, onSave, onCancel }) {
  return (
    <div className="space-y-6">
      {isDefaultMarker && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">⚙️ Editing Global Defaults</h4>
          <p className="text-sm text-amber-800 mb-2">
            {marker.id === -1
              ? 'Changes here will affect all booth markers (ID < 1000) that have a company assigned, unless they have individual overrides.'
              : 'Changes here will affect all booth markers (ID < 1000) that have no company assigned, unless they have individual overrides.'}
          </p>
        </div>
      )}

      {/* Position & Structure (not for defaults) */}
      {!isDefaultMarker && (
        <Section title="Position & Structure">
          <InputField label="Latitude" type="number" step="0.0001" value={marker.lat} onChange={(v) => onChange('lat', parseFloat(v))} />
          <InputField label="Longitude" type="number" step="0.0001" value={marker.lng} onChange={(v) => onChange('lng', parseFloat(v))} />
          <InputField label="Angle" type="number" step="0.1" value={marker.angle || 0} onChange={(v) => onChange('angle', parseFloat(v))} />
        </Section>
      )}

      {/* Visual Styling */}
      <Section title={isDefaultMarker ? "Default Visual Styling" : "Visual Styling"}>
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
        {!isDefaultMarker && <InputField label="Glyph (Booth Label)" value={marker.glyph} onChange={(v) => onChange('glyph', v)} />}
        <InputField label="Glyph Color" type="color" value={marker.glyphColor} onChange={(v) => onChange('glyphColor', v)} />
        <InputField label="Glyph Size" type="number" step="1" value={marker.glyphSize} onChange={(v) => onChange('glyphSize', parseFloat(v))} />
        {isDefaultMarker && (
          <>
            <InputField label="Rectangle Width" type="number" step="1" value={marker.rectWidth} onChange={(v) => onChange('rectWidth', parseFloat(v))} />
            <InputField label="Rectangle Height" type="number" step="1" value={marker.rectHeight} onChange={(v) => onChange('rectHeight', parseFloat(v))} />
          </>
        )}
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
