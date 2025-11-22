import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiFoodDrumstick, mdiBellRing, mdiCheckCircle, mdiAlertCircle } from '@mdi/js';
import { supabase } from '../../supabaseClient';

/**
 * EventDefaults - Component for managing default event settings
 * Accessible to: super_admin, system_manager, event_manager
 * Features:
 * - Default meal counts (breakfast, lunch, BBQ)
 * - Notification preferences
 * - Saved to organization_profile table
 */
export default function EventDefaults() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
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

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from organization_profile table
      // Note: If columns don't exist yet, this will fail gracefully and use defaults
      const { data, error: fetchError } = await supabase
        .from('organization_profile')
        .select('*')
        .single();

      if (fetchError) {
        // If no profile exists yet, use defaults
        if (fetchError.code === 'PGRST116') {
          console.log('No organization profile found, using defaults');
        } else {
          console.warn('Error loading settings (columns may not exist yet):', fetchError);
          // Don't throw - just use defaults if columns don't exist
        }
      } else if (data) {
        // Check if columns exist and have values - Saturday
        setDefaultBreakfastSat(data.default_breakfast_sat ?? 0);
        setDefaultLunchSat(data.default_lunch_sat ?? 0);
        setDefaultBbqSat(data.default_bbq_sat ?? 0);
        
        // Sunday
        setDefaultBreakfastSun(data.default_breakfast_sun ?? 0);
        setDefaultLunchSun(data.default_lunch_sun ?? 0);

        // Parse notification settings from JSON (if column exists)
        if (data.notification_settings) {
          const notifSettings = typeof data.notification_settings === 'string' 
            ? JSON.parse(data.notification_settings)
            : data.notification_settings;
          setEmailNotifications(notifSettings.emailNotifications ?? true);
          setNewSubscriptionNotify(notifSettings.newSubscriptionNotify ?? true);
          setAssignmentChangeNotify(notifSettings.assignmentChangeNotify ?? true);
        }
      }
    } catch (err) {
      console.warn('Failed to load settings (columns may not exist yet):', err);
      // Don't show error to user - just use defaults
    } finally {
      setLoading(false);
    }
  };

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

      // First, check if the columns exist by trying to select them
      const { error: checkError } = await supabase
        .from('organization_profile')
        .select('default_breakfast')
        .limit(1);

      if (checkError && checkError.message?.includes('column')) {
        // Columns don't exist yet - show helpful error
        setError('Database columns not yet created. Please run the migration: ALTER TABLE organization_profile ADD COLUMN...');
        console.error('EventDefaults columns missing. Run migration to add: default_breakfast, default_lunch, default_bbq, notification_settings');
        return;
      }

      // Upsert to organization_profile
      const { error: upsertError } = await supabase
        .from('organization_profile')
        .upsert({
          id: 1, // Single row for organization
          default_breakfast_sat: defaultBreakfastSat,
          default_lunch_sat: defaultLunchSat,
          default_bbq_sat: defaultBbqSat,
          default_breakfast_sun: defaultBreakfastSun,
          default_lunch_sun: defaultLunchSun,
          notification_settings: notificationSettings,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(t('settings.eventDefaults.errors.saveFailed'));
    } finally {
      setSaving(false);
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('settings.eventDefaults.title')}</h2>
        <p className="text-sm text-gray-600">{t('settings.eventDefaults.description')}</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiCheckCircle} size={1} className="text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">{t('settings.eventDefaults.saveSuccess')}</p>
            <p className="text-sm text-green-700">{t('settings.eventDefaults.saveSuccessMessage')}</p>
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
                <input
                  type="number"
                  disabled
                  value="—"
                  className="input-base bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('settings.eventDefaults.mealDefaults.sundayNoBbq')}
                </p>
              </div>
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

        {/* Save Button */}
        <div className="flex justify-end gap-3 bg-white rounded-lg shadow p-6">
          <button
            type="button"
            onClick={loadSettings}
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
