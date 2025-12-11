import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiCalendarEdit, mdiCheckCircle, mdiAlertCircle, mdiDomain } from '@mdi/js';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';

export default function PublicDefaultYear() {
  const { t } = useTranslation();
  const { settings, loading, updateSetting } = useOrganizationSettings();
  const { toastError, toastWarning } = useDialog();

  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (settings) {
      setValue(settings.public_default_year == null ? '' : String(settings.public_default_year));
    }
  }, [settings]);

  const validate = (v) => {
    if (v === '') return true;
    const n = Number(v);
    if (!Number.isInteger(n)) return false;
    if (n < 2000 || n > 2100) return false;
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!validate(value)) {
        throw new Error(t('settings.publicDefaultYear.errors.invalid'));
      }

      const parsed = value === '' ? null : parseInt(value, 10);

      await updateSetting('public_default_year', parsed);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update public default year', err);
      if (err.message?.includes('updated by another admin')) {
        toastWarning(err.message);
      } else {
        toastError(err.message || t('settings.publicDefaultYear.errors.saveFailed'));
      }
      setError(err.message || t('settings.publicDefaultYear.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">{t('settings.publicDefaultYear.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {t('settings.publicDefaultYear.title')}
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
            <Icon path={mdiDomain} size={0.6} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Organization Setting
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{t('settings.publicDefaultYear.description')}</p>
      </div>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiCheckCircle} size={1} className="text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              {t('settings.publicDefaultYear.saveSuccess')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiAlertCircle} size={1} className="text-red-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">{t('settings.publicDefaultYear.error')}</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="publicDefaultYear" className="label-base">
            {t('settings.publicDefaultYear.inputLabel')}
          </label>
          <input
            id="publicDefaultYear"
            type="number"
            min="2000"
            max="2100"
            placeholder={t('settings.publicDefaultYear.placeholder')}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-base"
          />
          <p className="text-xs text-gray-500 mt-2">{t('settings.publicDefaultYear.hint')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            data-testid="save-public-default-year"
          >
            {saving ? t('settings.publicDefaultYear.saving') : t('settings.publicDefaultYear.save')}
          </button>

          <button
            type="button"
            onClick={() =>
              setValue(
                settings?.public_default_year == null ? '' : String(settings.public_default_year),
              )
            }
            className="btn-outline"
          >
            {t('settings.publicDefaultYear.reset')}
          </button>
        </div>
      </form>
    </div>
  );
}
