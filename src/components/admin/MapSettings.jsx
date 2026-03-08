import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiMapMarker,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiInformation,
  mdiDomain,
  mdiCalendar,
  mdiContentCopy,
} from '@mdi/js';
import useEventMapSettings from '../../hooks/useEventMapSettings';
import { useDialog } from '../../contexts/DialogContext';
import { MAP_CONFIG } from '../../config/mapConfig';

/**
 * MapSettings - Component for managing map settings per year
 * Accessible to: super_admin, system_manager
 * Features:
 * - Year selector to choose which year's map settings to edit
 * - Default map center (lat/lng) per year
 * - Default/min/max zoom levels per year
 * - Saved to event_map_settings table
 * SCOPE: Event-specific (affects selected year only)
 */
export default function MapSettings({ selectedYear, setSelectedYear }) {
  const { t } = useTranslation();
  const {
    settings: eventSettings,
    loading: eventLoading,
    updateSettings,
    copyFromYear,
  } = useEventMapSettings(selectedYear);
  const { toastError, toastWarning, confirm } = useDialog();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Map configuration state - initialize with event settings or hardcoded defaults
  const [mapCenterLat, setMapCenterLat] = useState(MAP_CONFIG.DEFAULT_POSITION[0]);
  const [mapCenterLng, setMapCenterLng] = useState(MAP_CONFIG.DEFAULT_POSITION[1]);
  const [mapDefaultZoom, setMapDefaultZoom] = useState(MAP_CONFIG.DEFAULT_ZOOM);
  const [mapMinZoom, setMapMinZoom] = useState(MAP_CONFIG.MIN_ZOOM);
  const [mapMaxZoom, setMapMaxZoom] = useState(MAP_CONFIG.MAX_ZOOM);
  const [mapSearchZoom, setMapSearchZoom] = useState(MAP_CONFIG.SEARCH_ZOOM);

  // Sync local state when settings change
  useEffect(() => {
    if (eventSettings) {
      // Use event-specific settings
      setMapCenterLat(eventSettings.map_center_lat ?? MAP_CONFIG.DEFAULT_POSITION[0]);
      setMapCenterLng(eventSettings.map_center_lng ?? MAP_CONFIG.DEFAULT_POSITION[1]);
      setMapDefaultZoom(eventSettings.map_default_zoom ?? MAP_CONFIG.DEFAULT_ZOOM);
      setMapMinZoom(eventSettings.map_min_zoom ?? MAP_CONFIG.MIN_ZOOM);
      setMapMaxZoom(eventSettings.map_max_zoom ?? MAP_CONFIG.MAX_ZOOM);
      setMapSearchZoom(eventSettings.map_search_zoom ?? MAP_CONFIG.SEARCH_ZOOM);
    } else {
      // Fall back to hardcoded config
      setMapCenterLat(MAP_CONFIG.DEFAULT_POSITION[0]);
      setMapCenterLng(MAP_CONFIG.DEFAULT_POSITION[1]);
      setMapDefaultZoom(MAP_CONFIG.DEFAULT_ZOOM);
      setMapMinZoom(MAP_CONFIG.MIN_ZOOM);
      setMapMaxZoom(MAP_CONFIG.MAX_ZOOM);
      setMapSearchZoom(MAP_CONFIG.SEARCH_ZOOM);
    }
  }, [eventSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate zoom levels
      if (mapMinZoom > mapDefaultZoom || mapDefaultZoom > mapMaxZoom) {
        throw new Error(t('settings.mapDefaults.errors.invalidZoomLevels'));
      }

      if (mapSearchZoom < mapMinZoom || mapSearchZoom > mapMaxZoom) {
        throw new Error(t('settings.mapDefaults.errors.invalidSearchZoom'));
      }

      // Update event-specific settings
      const result = await updateSettings({
        map_center_lat: parseFloat(mapCenterLat),
        map_center_lng: parseFloat(mapCenterLng),
        map_default_zoom: parseInt(mapDefaultZoom),
        map_min_zoom: parseInt(mapMinZoom),
        map_max_zoom: parseInt(mapMaxZoom),
        map_search_zoom: parseInt(mapSearchZoom),
      });

      if (!result) {
        throw new Error('Failed to update map settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save map settings:', err);
      toastError(err.message || t('settings.mapDefaults.errors.saveFailed'));
      setError(err.message || t('settings.mapDefaults.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    const sourceYear = parseInt(selectedYear) - 1;
    const confirmed = await confirm({
      title: 'Copy Map Settings',
      message: `Copy map settings from ${sourceYear} to ${selectedYear}? This will overwrite current settings.`,
      confirmText: 'Copy Settings',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      setSaving(true);
      const result = await copyFromYear(sourceYear);
      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(`Failed to copy settings from ${sourceYear}:`, err);
      toastError(err.message || 'Failed to copy settings');
    } finally {
      setSaving(false);
    }
  };

  const loading = eventLoading;
  const usingEventSettings = !!eventSettings;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">{t('settings.mapDefaults.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {t('settings.mapDefaults.title')} - {selectedYear}
          </h2>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${
                usingEventSettings
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <Icon
                path={mdiDomain}
                size={0.6}
                className={usingEventSettings ? 'text-green-600' : 'text-orange-600'}
              />
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  usingEventSettings ? 'text-green-700' : 'text-orange-700'
                }`}
              >
                {usingEventSettings ? 'Event Settings' : 'Global Defaults'}
              </span>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Event Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        <p className="text-sm text-gray-600">
          {usingEventSettings
            ? `Settings specific to the ${selectedYear} event are active.`
            : `No custom settings mapped for ${selectedYear} yet. Edit values below or copy from a prior year.`}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiCheckCircle} size={1} className="text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">{t('settings.mapDefaults.saveSuccess')}</p>
            <p className="text-sm text-green-700">
              {`Map settings saved for ${selectedYear}.`}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiAlertCircle} size={1} className="text-red-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">{t('settings.mapDefaults.error')}</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Map Center Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={mdiMapMarker} size={1} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.mapDefaults.mapCenter.title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('settings.mapDefaults.mapCenter.description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latitude */}
            <div>
              <label htmlFor="mapCenterLat" className="label-base">
                {t('settings.mapDefaults.mapCenter.latitude')}
              </label>
              <input
                type="number"
                id="mapCenterLat"
                step="0.000001"
                min="-90"
                max="90"
                value={mapCenterLat}
                onChange={(e) => setMapCenterLat(e.target.value)}
                className="input-base"
                placeholder="51.898095"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.mapDefaults.mapCenter.latitudeRange')}
              </p>
            </div>

            {/* Longitude */}
            <div>
              <label htmlFor="mapCenterLng" className="label-base">
                {t('settings.mapDefaults.mapCenter.longitude')}
              </label>
              <input
                type="number"
                id="mapCenterLng"
                step="0.000001"
                min="-180"
                max="180"
                value={mapCenterLng}
                onChange={(e) => setMapCenterLng(e.target.value)}
                className="input-base"
                placeholder="5.772961"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.mapDefaults.mapCenter.longitudeRange')}
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Icon path={mdiInformation} size={0.8} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{t('settings.mapDefaults.mapCenter.hint')}</p>
          </div>
        </div>

        {/* Zoom Levels Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={mdiMapMarker} size={1} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.mapDefaults.zoomLevels.title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('settings.mapDefaults.zoomLevels.description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Zoom */}
            <div>
              <label htmlFor="mapDefaultZoom" className="label-base">
                {t('settings.mapDefaults.zoomLevels.defaultZoom')}
              </label>
              <input
                type="number"
                id="mapDefaultZoom"
                min="1"
                max="22"
                value={mapDefaultZoom}
                onChange={(e) => setMapDefaultZoom(e.target.value)}
                className="input-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.mapDefaults.zoomLevels.defaultZoomDesc')}
              </p>
            </div>

            {/* Search Zoom */}
            <div>
              <label htmlFor="mapSearchZoom" className="label-base">
                {t('settings.mapDefaults.zoomLevels.searchZoom')}
              </label>
              <input
                type="number"
                id="mapSearchZoom"
                min="1"
                max="22"
                value={mapSearchZoom}
                onChange={(e) => setMapSearchZoom(e.target.value)}
                className="input-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.mapDefaults.zoomLevels.searchZoomDesc')}
              </p>
            </div>

            {/* Min Zoom */}
            <div>
              <label htmlFor="mapMinZoom" className="label-base">
                {t('settings.mapDefaults.zoomLevels.minZoom')}
              </label>
              <input
                type="number"
                id="mapMinZoom"
                min="1"
                max="22"
                value={mapMinZoom}
                onChange={(e) => setMapMinZoom(e.target.value)}
                className="input-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.mapDefaults.zoomLevels.minZoomDesc')}
              </p>
            </div>

            {/* Max Zoom */}
            <div>
              <label htmlFor="mapMaxZoom" className="label-base">
                {t('settings.mapDefaults.zoomLevels.maxZoom')}
              </label>
              <input
                type="number"
                id="mapMaxZoom"
                min="1"
                max="22"
                value={mapMaxZoom}
                onChange={(e) => setMapMaxZoom(e.target.value)}
                className="input-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.mapDefaults.zoomLevels.maxZoomDesc')}
              </p>
            </div>
          </div>

          {/* Zoom levels info */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">
                {t('settings.mapDefaults.zoomLevels.constraint')}:
              </span>{' '}
              {t('settings.mapDefaults.zoomLevels.constraintDesc')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between bg-white rounded-lg shadow p-6">
          <button
            type="button"
            onClick={handleCopyFromPrevious}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon path={mdiContentCopy} size={0.8} />
            Copy from {parseInt(selectedYear) - 1}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('settings.mapDefaults.saving') : t('settings.mapDefaults.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
