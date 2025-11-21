import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabaseClient';
import Icon from '@mdi/react';
import { mdiPalette, mdiCheckCircle } from '@mdi/js';

/**
 * BrandingSettings - Visual branding configuration (colors, fonts)
 * Note: Organization name and logo are managed in the Companies tab
 */
export default function BrandingSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Branding state
  const [themeColor, setThemeColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Arvo, Sans-serif');

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Organization_Profile')
        .select('theme_color, font_family')
        .eq('id', 1)
        .single();

      if (error) throw error;

      if (data) {
        setThemeColor(data.theme_color || '#ffffff');
        setFontFamily(data.font_family || 'Arvo, Sans-serif');
      }
    } catch (err) {
      console.error('Error loading branding settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('Organization_Profile')
        .update({
          theme_color: themeColor,
          font_family: fontFamily,
        })
        .eq('id', 1);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving branding settings:', err);
      alert(t('settings.branding.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t('settings.branding.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Icon path={mdiPalette} size={1} />
          {t('settings.branding.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('settings.branding.description')}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          💡 {t('settings.branding.note')}
        </p>
      </div>

      {/* Branding Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Theme Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.branding.themeColor.label')}
          </label>
          <p className="text-xs text-gray-500 mb-3">
            {t('settings.branding.themeColor.description')}
          </p>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-12 w-24 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              placeholder="#ffffff"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={7}
            />
          </div>
          {/* Color preview */}
          <div className="mt-3 space-y-2">
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
              <p className="font-bold text-white text-lg">
                Preview Text (White on Color)
              </p>
              <p className="text-white text-sm opacity-90">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-white">
              <p className="font-bold text-lg" style={{ color: themeColor }}>
                Preview Text (Color on White)
              </p>
              <p className="text-sm" style={{ color: themeColor }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.branding.fontFamily.label')}
          </label>
          <p className="text-xs text-gray-500 mb-3">
            {t('settings.branding.fontFamily.description')}
          </p>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Arvo, Sans-serif">Arvo (Default)</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
            <option value="Impact, sans-serif">Impact</option>
          </select>
          {/* Font preview */}
          <div className="mt-3 p-4 rounded-lg border border-gray-300 bg-white" style={{ fontFamily }}>
            <p className="text-lg text-gray-900 font-semibold">
              The quick brown fox jumps over the lazy dog
            </p>
            <p className="text-sm text-gray-700 mt-1">
              1234567890 !@#$%^&*()
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setThemeColor('#ffffff');
            setFontFamily('Arvo, Sans-serif');
          }}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {t('settings.branding.reset')}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            t('common.saving')
          ) : showSuccess ? (
            <>
              <Icon path={mdiCheckCircle} size={0.8} />
              {t('settings.branding.saveSuccess')}
            </>
          ) : (
            t('common.save')
          )}
        </button>
      </div>
    </div>
  );
}
