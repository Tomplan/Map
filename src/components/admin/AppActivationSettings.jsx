import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiRocketLaunch, mdiContentSave } from '@mdi/js';
import useOrganizationProfile from '../../hooks/useOrganizationProfile';

export default function AppActivationSettings() {
  const { t } = useTranslation();
  const { profile, loading, updateProfile } = useOrganizationProfile();

  const [isActive, setIsActive] = useState(false);
  const [maintenanceMsgNl, setMaintenanceMsgNl] = useState(
    'De digitale beursgids opent binnenkort!',
  );
  const [maintenanceMsgEn, setMaintenanceMsgEn] = useState(
    'The digital fair guide will open soon!',
  );
  const [maintenanceMsgDe, setMaintenanceMsgDe] = useState(
    'Der digitale Messeführer wird bald geöffnet!',
  );
  const [fallbackLocale, setFallbackLocale] = useState('nl');
  const [countdownDate, setCountdownDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [isSavingAppStatus, setIsSavingAppStatus] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  const fallbackMessageByLocale = {
    nl: maintenanceMsgNl,
    en: maintenanceMsgEn,
    de: maintenanceMsgDe,
  };

  useEffect(() => {
    if (profile) {
      setIsActive(!!profile.is_app_active);
      setMaintenanceMsgNl(
        profile.maintenance_message_nl ??
          profile.maintenance_message ??
          'De digitale beursgids opent binnenkort!',
      );
      setMaintenanceMsgEn(
        profile.maintenance_message_en ?? 'The digital fair guide will open soon!',
      );
      setMaintenanceMsgDe(
        profile.maintenance_message_de ?? 'Der digitale Messeführer wird bald geöffnet!',
      );
      setFallbackLocale(
        profile.maintenance_message_fallback_locale ??
          (profile.maintenance_message_de &&
          profile.maintenance_message === profile.maintenance_message_de
            ? 'de'
            : profile.maintenance_message_en &&
                profile.maintenance_message === profile.maintenance_message_en
              ? 'en'
              : 'nl'),
      );
      if (profile.countdown_target_date) {
        // format for input type="datetime-local": YYYY-MM-DDThh:mm
        try {
          const date = new Date(profile.countdown_target_date);
          const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setCountdownDate(formatted);
        } catch (e) {
          console.error(e);
          setCountdownDate('');
        }
      } else {
        setCountdownDate('');
      }
    }
  }, [profile]);

  const actionButtonClass = isActive
    ? 'bg-orange-600 text-white hover:bg-orange-700'
    : 'bg-green-600 text-white hover:bg-green-700';

  const handleToggleAppStatus = async () => {
    const nextIsActive = !isActive;
    const confirmationMessage = nextIsActive
      ? t('settings.appActivation.confirm.goLive')
      : t('settings.appActivation.confirm.goOffline');

    if (typeof window !== 'undefined' && window.confirm && !window.confirm(confirmationMessage)) {
      return;
    }

    setIsSavingAppStatus(true);
    setSaveMessage({ text: '', type: '' });

    const { error } = await updateProfile({ is_app_active: nextIsActive });

    if (error) {
      setSaveMessage({ text: t('settings.appActivation.saveError', { error }), type: 'error' });
    } else {
      setIsActive(nextIsActive);
      setSaveMessage({ text: t('settings.appActivation.saveSuccess'), type: 'success' });
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000);
    }

    setIsSavingAppStatus(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage({ text: '', type: '' });

    const updates = {
      is_app_active: isActive,
      maintenance_message: fallbackMessageByLocale[fallbackLocale],
      maintenance_message_nl: maintenanceMsgNl,
      maintenance_message_en: maintenanceMsgEn,
      maintenance_message_de: maintenanceMsgDe,
      maintenance_message_fallback_locale: fallbackLocale,
      countdown_target_date: countdownDate ? new Date(countdownDate).toISOString() : null,
    };

    const { error } = await updateProfile(updates);

    if (error) {
      setSaveMessage({ text: t('settings.appActivation.saveError', { error }), type: 'error' });
    } else {
      setSaveMessage({ text: t('settings.appActivation.saveSuccess'), type: 'success' });
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="text-gray-500">{t('settings.appActivation.loading')}</div>;
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <Icon path={mdiRocketLaunch} size={1} className="text-button-primary mr-3" />
        <h2 className="text-xl font-semibold">{t('settings.appActivation.title')}</h2>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Activation */}
        <div className="flex items-center justify-between p-4 border rounded-md">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {t('settings.appActivation.activation.title')}
            </h3>
            <p className="text-sm text-gray-500">
              {isActive
                ? t('settings.appActivation.statusDescription.live')
                : t('settings.appActivation.statusDescription.offline')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium min-w-16 text-right text-sm text-gray-500">
              {isActive
                ? t('settings.appActivation.status.live')
                : t('settings.appActivation.status.offline')}
            </span>
            <button
              onClick={handleToggleAppStatus}
              disabled={isSavingAppStatus}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${actionButtonClass}`}
            >
              {isSavingAppStatus
                ? t('settings.appActivation.saving')
                : isActive
                  ? t('settings.appActivation.actions.goOffline')
                  : t('settings.appActivation.actions.goLive')}
            </button>
          </div>
        </div>

        {/* Boodschap & Klok */}
        <div
          className={`space-y-4 p-4 rounded-md border ${isActive ? 'opacity-50 pointer-events-none' : 'bg-gray-50'}`}
        >
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {t('settings.appActivation.translationsTitle')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('settings.appActivation.translationsDescription')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.appActivation.languageFields.nl')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input-border rounded-md bg-input-bg text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-input-border-focus"
                value={maintenanceMsgNl}
                onChange={(e) => setMaintenanceMsgNl(e.target.value)}
                disabled={isActive}
                placeholder={t('settings.appActivation.placeholders.nl')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.appActivation.languageFields.en')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input-border rounded-md bg-input-bg text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-input-border-focus"
                value={maintenanceMsgEn}
                onChange={(e) => setMaintenanceMsgEn(e.target.value)}
                disabled={isActive}
                placeholder={t('settings.appActivation.placeholders.en')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.appActivation.languageFields.de')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input-border rounded-md bg-input-bg text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-input-border-focus"
                value={maintenanceMsgDe}
                onChange={(e) => setMaintenanceMsgDe(e.target.value)}
                disabled={isActive}
                placeholder={t('settings.appActivation.placeholders.de')}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {t('settings.appActivation.fallback.title')}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              {t('settings.appActivation.fallback.description')}
            </p>
            <div className="space-y-2">
              {['nl', 'en', 'de'].map((locale) => {
                const checked = fallbackLocale === locale;

                return (
                  <label
                    key={locale}
                    className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      checked
                        ? 'border-button-primary bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="maintenance-fallback-locale"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setFallbackLocale(locale)}
                      disabled={isActive}
                    />
                    <span
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        checked
                          ? 'border-button-primary bg-button-primary text-white'
                          : 'border-gray-300 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span>
                      <span className="block font-medium text-gray-900">
                        {t(`settings.appActivation.fallback.options.${locale}`)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.appActivation.countdownLabel')}
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-input-border rounded-md bg-input-bg text-input-text focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-input-border-focus max-w-sm"
              value={countdownDate}
              onChange={(e) => setCountdownDate(e.target.value)}
              disabled={isActive}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('settings.appActivation.countdownHint')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          {saveMessage.text && (
            <span
              className={`mr-4 text-sm ${saveMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}
            >
              {saveMessage.text}
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-button-primary text-white rounded hover:bg-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon path={mdiContentSave} size={0.8} className="mr-2" />
            {saving ? t('settings.appActivation.saving') : t('settings.appActivation.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
