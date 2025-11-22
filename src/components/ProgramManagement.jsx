import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useEventActivities from '../hooks/useEventActivities';
import { MdEdit, MdDelete, MdAdd, MdDragIndicator } from 'react-icons/md';

/**
 * ProgramManagement - Admin component for managing event activities
 * Allows admins to view, add, edit, delete, and reorder activities
 */
export default function ProgramManagement() {
  const { t, i18n } = useTranslation();
  const { activities, loading, error, getActivityLocation, refetch } = useEventActivities();
  const [activeTab, setActiveTab] = useState('saturday');

  const currentActivities = activities[activeTab] || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('programManagement.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{t('programManagement.error')}: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('programManagement.title')}
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <MdAdd className="text-xl" />
            <span>{t('programManagement.addActivity')}</span>
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('saturday')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'saturday'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('programManagement.saturday')} ({activities.saturday?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sunday')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sunday'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('programManagement.sunday')} ({activities.sunday?.length || 0})
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-gray-200">
        {currentActivities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">{t('programManagement.noActivitiesFound')}</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {t('programManagement.addFirstActivity')}
            </button>
          </div>
        ) : (
          currentActivities.map((activity, index) => {
            const location = getActivityLocation(activity, i18n.language);
            const title = i18n.language === 'nl' ? activity.title_nl : activity.title_en;
            const description = i18n.language === 'nl' ? activity.description_nl : activity.description_en;
            const badge = i18n.language === 'nl' ? activity.badge_nl : activity.badge_en;

            return (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <button
                    className="mt-1 text-gray-400 hover:text-gray-600 cursor-move"
                    title={t('programManagement.dragToReorder')}
                  >
                    <MdDragIndicator className="text-2xl" />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Display Order Badge */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                            {activity.display_order}
                          </span>
                          <span className="text-sm text-gray-500">
                            {activity.start_time} - {activity.end_time}
                          </span>
                          {badge && (
                            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                              {badge}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {description}
                        </p>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">{t('programManagement.location')}:</span>
                          <span className="font-medium text-gray-700">
                            {location.text}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            activity.location_type === 'exhibitor'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.location_type === 'exhibitor' ? t('programManagement.exhibitor') : t('programManagement.venue')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('programManagement.edit')}
                        >
                          <MdEdit className="text-xl" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('programManagement.delete')}
                        >
                          <MdDelete className="text-xl" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {currentActivities.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <p className="text-sm text-gray-600">
            {t('programManagement.totalActivities')}: <span className="font-medium">{currentActivities.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}
