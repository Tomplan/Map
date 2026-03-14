import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiFoodDrumstick,
  mdiBellRing,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiDomain,
  mdiCurrencyUsd,
  mdiFilterMinus,
  mdiPlus,
  mdiClose,
} from '@mdi/js';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';

/**
 * EventDefaults - Component for managing default event settings
 * Accessible to: super_admin, system_manager, event_manager
 * Features:
 * - Default meal counts (breakfast, lunch, BBQ)
 * - Notification preferences
 * - Saved to organization_settings table
 * SCOPE: Organization-wide (affects all users)
 */
export default function EventDefaults() {
  const { t } = useTranslation();
  const { settings, loading, error: loadError, updateSettings } = useOrganizationSettings();
  const { toastError, toastWarning } = useDialog();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Meal count defaults - Saturday
  const [defaultBreakfastSat, setDefaultBreakfastSat] = useState(0);
  const [defaultLunchSat, setDefaultLunchSat] = useState(0);
  const [defaultBbqSat, setDefaultBbqSat] = useState(0);

  // Meal count defaults - Sunday
  const [defaultBreakfastSun, setDefaultBreakfastSun] = useState(0);
  const [defaultLunchSun, setDefaultLunchSun] = useState(0);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newSubscriptionNotify, setNewSubscriptionNotify] = useState(true);
  const [assignmentChangeNotify, setAssignmentChangeNotify] = useState(true);
  // Event default coins (stored on organization_profile)
  const [defaultCoins, setDefaultCoins] = useState(0);

  // Invoice parsing ignored items
  const [invoiceIgnoredItems, setInvoiceIgnoredItems] = useState([]);
  const [newIgnoredItem, setNewIgnoredItem] = useState('');

  // Sync local state with organization settings when they load
  useEffect(() => {
    if (settings) {
      setDefaultBreakfastSat(settings.default_breakfast_sat ?? 0);
      setDefaultLunchSat(settings.default_lunch_sat ?? 0);
      setDefaultBbqSat(settings.default_bbq_sat ?? 0);
      setDefaultBreakfastSun(settings.default_breakfast_sun ?? 0);
      setDefaultLunchSun(settings.default_lunch_sun ?? 0);
      setDefaultCoins(settings.default_coins ?? 0);
      setInvoiceIgnoredItems(settings.invoice_ignored_items ?? []);

      // Parse notification settings from JSONB
      if (settings.notification_settings) {
        const notifSettings =
          typeof settings.notification_settings === 'string'
            ? JSON.parse(settings.notification_settings)
            : settings.notification_settings;
        setEmailNotifications(notifSettings.emailNotifications ?? true);
        setNewSubscriptionNotify(notifSettings.newSubscriptionNotify ?? true);
        setAssignmentChangeNotify(notifSettings.assignmentChangeNotify ?? true);
      }
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare notification settings object
      const notificationSettings = {
        emailNotifications,
        newSubscriptionNotify,
        assignmentChangeNotify,
      };

      // Update organization settings using the hook (includes default_coins)
      const result = await updateSettings({
        default_breakfast_sat: defaultBreakfastSat,
        default_lunch_sat: defaultLunchSat,
        default_bbq_sat: defaultBbqSat,
        default_breakfast_sun: defaultBreakfastSun,
        default_lunch_sun: defaultLunchSun,
        default_coins: defaultCoins,
        notification_settings: notificationSettings,
        invoice_ignored_items: invoiceIgnoredItems,
      });

      if (!result) {
        throw new Error('Failed to update settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      // Check if it's a conflict error
      if (err.message?.includes('updated by another admin')) {
        toastWarning(err.message);
        setError(t('settings.eventDefaults.errors.saveFailed'));
      } else {
        toastError(err.message || t('settings.eventDefaults.errors.saveFailed'));
        setError(err.message || t('settings.eventDefaults.errors.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to current settings from database
    if (settings) {
      setDefaultBreakfastSat(settings.default_breakfast_sat ?? 0);
      setDefaultLunchSat(settings.default_lunch_sat ?? 0);
      setDefaultBbqSat(settings.default_bbq_sat ?? 0);
      setDefaultBreakfastSun(settings.default_breakfast_sun ?? 0);
      setDefaultLunchSun(settings.default_lunch_sun ?? 0);
      setInvoiceIgnoredItems(settings.invoice_ignored_items ?? []);

      if (settings.notification_settings) {
        const notifSettings =
          typeof settings.notification_settings === 'string'
            ? JSON.parse(settings.notification_settings)
            : settings.notification_settings;
        setEmailNotifications(notifSettings.emailNotifications ?? true);
        setNewSubscriptionNotify(notifSettings.newSubscriptionNotify ?? true);
        setAssignmentChangeNotify(notifSettings.assignmentChangeNotify ?? true);
      }
      // Reset coins from settings
      setDefaultCoins(settings.default_coins ?? 0);
    }
  };

  const handleAddIgnoredItem = () => {
    const trimmed = newIgnoredItem.trim();
    if (trimmed && !invoiceIgnoredItems.includes(trimmed)) {
      setInvoiceIgnoredItems([...invoiceIgnoredItems, trimmed]);
      setNewIgnoredItem('');
    }
  };

  const handleRemoveIgnoredItem = (itemToRemove) => {
    setInvoiceIgnoredItems(invoiceIgnoredItems.filter((item) => item !== itemToRemove));
  };

  const handleIgnoredItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIgnoredItem();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">{t('settings.eventDefaults.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{t('settings.eventDefaults.title')}</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
            <Icon path={mdiDomain} size={0.6} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Organization Setting
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{t('settings.eventDefaults.description')}</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiCheckCircle} size={1} className="text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              {t('settings.eventDefaults.saveSuccess')}
            </p>
            <p className="text-sm text-green-700">
              {t('settings.eventDefaults.saveSuccessMessage')}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiAlertCircle} size={1} className="text-red-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">{t('settings.eventDefaults.error')}</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Meal Count Defaults Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={mdiFoodDrumstick} size={1} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.eventDefaults.mealDefaults.title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('settings.eventDefaults.mealDefaults.description')}
          </p>

          {/* Saturday Meals */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              {t('settings.eventDefaults.mealDefaults.saturday')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Saturday Breakfast */}
              <div>
                <label htmlFor="breakfastSat" className="label-base">
                  {t('settings.eventDefaults.mealDefaults.breakfast')}
                </label>
                <input
                  type="number"
                  id="breakfastSat"
                  min="0"
                  max="9999"
                  value={defaultBreakfastSat}
                  onChange={(e) => setDefaultBreakfastSat(parseInt(e.target.value) || 0)}
                  className="input-base"
                />
              </div>

              {/* Saturday Lunch */}
              <div>
                <label htmlFor="lunchSat" className="label-base">
                  {t('settings.eventDefaults.mealDefaults.lunch')}
                </label>
                <input
                  type="number"
                  id="lunchSat"
                  min="0"
                  max="9999"
                  value={defaultLunchSat}
                  onChange={(e) => setDefaultLunchSat(parseInt(e.target.value) || 0)}
                  className="input-base"
                />
              </div>

              {/* Saturday BBQ */}
              <div>
                <label htmlFor="bbqSat" className="label-base">
                  {t('settings.eventDefaults.mealDefaults.bbq')}
                </label>
                <input
                  type="number"
                  id="bbqSat"
                  min="0"
                  max="9999"
                  value={defaultBbqSat}
                  onChange={(e) => setDefaultBbqSat(parseInt(e.target.value) || 0)}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Sunday Meals */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              {t('settings.eventDefaults.mealDefaults.sunday')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sunday Breakfast */}
              <div>
                <label htmlFor="breakfastSun" className="label-base">
                  {t('settings.eventDefaults.mealDefaults.breakfast')}
                </label>
                <input
                  type="number"
                  id="breakfastSun"
                  min="0"
                  max="9999"
                  value={defaultBreakfastSun}
                  onChange={(e) => setDefaultBreakfastSun(parseInt(e.target.value) || 0)}
                  className="input-base"
                />
              </div>

              {/* Sunday Lunch */}
              <div>
                <label htmlFor="lunchSun" className="label-base">
                  {t('settings.eventDefaults.mealDefaults.lunch')}
                </label>
                <input
                  type="number"
                  id="lunchSun"
                  min="0"
                  max="9999"
                  value={defaultLunchSun}
                  onChange={(e) => setDefaultLunchSun(parseInt(e.target.value) || 0)}
                  className="input-base"
                />
              </div>

              {/* Sunday - no BBQ */}
              <div className="opacity-50">
                <label className="label-base text-gray-400">
                  {t('settings.eventDefaults.mealDefaults.bbq')}
                </label>
                <span
                  className="input-base bg-gray-100 cursor-not-allowed block w-full h-[2.5rem] rounded text-center text-gray-400"
                  aria-disabled="true"
                >
                  —
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {t('settings.eventDefaults.mealDefaults.sundayNoBbq')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Default Coins (stored on organization_profile) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={mdiCurrencyUsd} size={1} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.eventDefaults.coins.title', 'Default coins')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t(
              'settings.eventDefaults.coins.description',
              'Number of default coins assigned to a new subscription when created.',
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-sm">
            <div>
              <label htmlFor="defaultCoins" className="label-base">
                {t('settings.eventDefaults.coins.label', 'Default coins')}
              </label>
              <input
                type="number"
                id="defaultCoins"
                min="0"
                max="9999"
                value={defaultCoins}
                onChange={(e) => setDefaultCoins(parseInt(e.target.value) || 0)}
                className="input-base"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={mdiBellRing} size={1} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.eventDefaults.notifications.title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('settings.eventDefaults.notifications.description')}
          </p>

          <div className="space-y-4">
            {/* Email Notifications Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="emailNotifications" className="font-medium text-gray-900">
                  {t('settings.eventDefaults.notifications.emailNotifications')}
                </label>
                <p className="text-sm text-gray-600">
                  {t('settings.eventDefaults.notifications.emailNotificationsDesc')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotifications}
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  emailNotifications ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* New Subscription Notifications */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label htmlFor="newSubscriptionNotify" className="font-medium text-gray-900">
                  {t('settings.eventDefaults.notifications.newSubscription')}
                </label>
                <p className="text-sm text-gray-600">
                  {t('settings.eventDefaults.notifications.newSubscriptionDesc')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={newSubscriptionNotify}
                onClick={() => setNewSubscriptionNotify(!newSubscriptionNotify)}
                disabled={!emailNotifications}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  newSubscriptionNotify && emailNotifications ? 'bg-orange-600' : 'bg-gray-300'
                } ${!emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    newSubscriptionNotify ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Assignment Change Notifications */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label htmlFor="assignmentChangeNotify" className="font-medium text-gray-900">
                  {t('settings.eventDefaults.notifications.assignmentChange')}
                </label>
                <p className="text-sm text-gray-600">
                  {t('settings.eventDefaults.notifications.assignmentChangeDesc')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={assignmentChangeNotify}
                onClick={() => setAssignmentChangeNotify(!assignmentChangeNotify)}
                disabled={!emailNotifications}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  assignmentChangeNotify && emailNotifications ? 'bg-orange-600' : 'bg-gray-300'
                } ${!emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    assignmentChangeNotify ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Processing Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={mdiFilterMinus} size={1} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.eventDefaults.invoiceProcessing.title', 'Invoice Processing')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t(
              'settings.eventDefaults.invoiceProcessing.description',
              'Manage text strings that will cause a line item to be ignored during PDF invoice import.',
            )}
          </p>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="newIgnoredItem" className="label-base">
                {t('settings.eventDefaults.invoiceProcessing.addLabel', 'Add Ignored Text')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="newIgnoredItem"
                  value={newIgnoredItem}
                  onChange={(e) => setNewIgnoredItem(e.target.value)}
                  onKeyDown={handleIgnoredItemKeyDown}
                  placeholder={t(
                    'settings.eventDefaults.invoiceProcessing.placeholder',
                    'e.g. Test, Verzendkosten',
                  )}
                  className="input-base flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddIgnoredItem}
                  disabled={!newIgnoredItem.trim()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Icon path={mdiPlus} size={0.8} />
                  {t('common.add', 'Add')}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t(
                  'settings.eventDefaults.invoiceProcessing.currentList',
                  'Currently Ignored Strings:',
                )}
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[100px] flex flex-wrap gap-2 content-start">
                {invoiceIgnoredItems.length === 0 ? (
                  <span className="text-gray-400 text-sm italic w-full text-center mt-6">
                    {t(
                      'settings.eventDefaults.invoiceProcessing.emptyList',
                      'No items ignored. All line items will be processed.',
                    )}
                  </span>
                ) : (
                  invoiceIgnoredItems.map((item, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-800 text-sm px-3 py-1 rounded-full shadow-sm"
                    >
                      <span className="font-medium">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIgnoredItem(item)}
                        className="p-0.5 hover:bg-orange-100 rounded-full transition-colors text-orange-500 hover:text-orange-700 focus:outline-none"
                        aria-label={t('common.remove', 'Remove') + ' ' + item}
                      >
                        <Icon path={mdiClose} size={0.6} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
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
            {t('settings.eventDefaults.reset')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('settings.eventDefaults.saving') : t('settings.eventDefaults.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
