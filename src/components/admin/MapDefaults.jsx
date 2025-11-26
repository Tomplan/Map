import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiMapMarker, mdiCheckCircle, mdiAlertCircle, mdiInformation } from '@mdi/js';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';

/**
 * MapDefaults - Component for managing default map settings
 * Accessible to: super_admin, system_manager
 * Features:
 * - Default map center (lat/lng)
 * - Default/min/max zoom levels
 * - Enabled tile layers
 * - Saved to organization_settings table
 */
export default function MapDefaults() {
  const { t } = useTranslation();
  const { settings, loading, error: loadError, updateSettings } = useOrganizationSettings();
  const { toastError, toastWarning } = useDialog();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Map configuration state
  const [mapCenterLat, setMapCenterLat] = useState(51.898095);
  const [mapCenterLng, setMapCenterLng] = useState(5.772961);
  const [mapDefaultZoom, setMapDefaultZoom] = useState(17);
  const [mapMinZoom, setMapMinZoom] = useState(14);
  const [mapMaxZoom, setMapMaxZoom] = useState(22);
  const [mapSearchZoom, setMapSearchZoom] = useState(21);

  // Sync local state with organization settings when they load
  useEffect(() => {
    if (settings) {
      setMapCenterLat(settings.map_center_lat ?? 51.898095);
      setMapCenterLng(settings.map_center_lng ?? 5.772961);
      setMapDefaultZoom(settings.map_default_zoom ?? 17);
      setMapMinZoom(settings.map_min_zoom ?? 14);
      setMapMaxZoom(settings.map_max_zoom ?? 22);
      setMapSearchZoom(settings.map_search_zoom ?? 21);
    }
  }, [settings]);

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

      // Update organization settings using the hook
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
      // Check if it's a conflict error
      if (err.message?.includes('updated by another admin')) {
        toastWarning(err.message);
        setError(t('settings.mapDefaults.errors.saveFailed'));
      } else {
        toastError(err.message || t('settings.mapDefaults.errors.saveFailed'));
        setError(err.message || t('settings.mapDefaults.errors.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to current settings from database
    if (settings) {
      setMapCenterLat(settings.map_center_lat ?? 51.898095);
      setMapCenterLng(settings.map_center_lng ?? 5.772961);
      setMapDefaultZoom(settings.map_default_zoom ?? 17);
      setMapMinZoom(settings.map_min_zoom ?? 14);
      setMapMaxZoom(settings.map_max_zoom ?? 22);
      setMapSearchZoom(settings.map_search_zoom ?? 21);
    }
  };

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
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('settings.mapDefaults.title')}</h2>
        <p className="text-sm text-gray-600">{t('settings.mapDefaults.description')}</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiCheckCircle} size={1} className="text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">{t('settings.mapDefaults.saveSuccess')}</p>
            <p className="text-sm text-green-700">{t('settings.mapDefaults.saveSuccessMessage')}</p>
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
            <p className="text-sm text-blue-800">
              {t('settings.mapDefaults.mapCenter.hint')}
            </p>
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
              <span className="font-medium">{t('settings.mapDefaults.zoomLevels.constraint')}:</span>{' '}
              {t('settings.mapDefaults.zoomLevels.constraintDesc')}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 bg-white rounded-lg shadow p-6">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('settings.mapDefaults.reset')}
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
