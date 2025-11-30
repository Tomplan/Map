import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useEventActivities from '../hooks/useEventActivities';
import { MdEdit, MdDelete, MdAdd, MdDragIndicator } from 'react-icons/md';
import { supabase } from '../supabaseClient';
import ActivityForm from './ActivityForm';
import YearScopeBadge from './admin/YearScopeBadge';
import Modal from './common/Modal';

/**
 * ProgramManagement - Admin component for managing event activities
 * Allows admins to view, add, edit, delete, and reorder activities
 */
export default function ProgramManagement() {
  const { t, i18n } = useTranslation();
  const { activities, loading, error, getActivityLocation, refetch } = useEventActivities();
  const [activeTab, setActiveTab] = useState('saturday');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title }
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [reordering, setReordering] = useState(false);

  const currentActivities = activities[activeTab] || [];

  /**
   * Handle delete activity
   */
  const handleDelete = async (activityId) => {
    if (!deleteConfirm || deleteConfirm.id !== activityId) return;

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('event_activities')
        .delete()
        .eq('id', activityId);

      if (deleteError) throw deleteError;

      // Refetch activities to update the list
      await refetch();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert(t('programManagement.deleteError') + ': ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (e, activity, index) => {
    setDraggedItem({ activity, index });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handle drop - reorder activities
   */
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === dropIndex) {
      return;
    }

    setReordering(true);

    try {
      // Create new ordered array
      const items = [...currentActivities];
      const [draggedActivity] = items.splice(draggedItem.index, 1);
      items.splice(dropIndex, 0, draggedActivity);

      // Update display_order for all affected items
      const updates = items.map((activity, index) => ({
        id: activity.id,
        display_order: index + 1
      }));

      // Batch update all display_orders
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('event_activities')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      // Refetch to show new order
      await refetch();
    } catch (err) {
      console.error('Error reordering activities:', err);
      alert(t('programManagement.reorderError') + ': ' + err.message);
    } finally {
      setReordering(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('programManagement.title')}
            </h2>
            <div><YearScopeBadge scope="year" /></div>
          </div>
          <button 
            onClick={() => {
              setEditActivity(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
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
            <button 
              onClick={() => {
                setEditActivity(null);
                setShowForm(true);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('programManagement.addFirstActivity')}
            </button>
          </div>
        ) : (
          currentActivities.map((activity, index) => {
            const location = getActivityLocation(activity, i18n.language);
            const lang = i18n.language || 'en';
            const title = lang === 'nl' ? activity.title_nl : lang === 'de' ? activity.title_de : activity.title_en;
            const description = lang === 'nl' ? activity.description_nl : lang === 'de' ? activity.description_de : activity.description_en;
            const badge = lang === 'nl' ? activity.badge_nl : lang === 'de' ? activity.badge_de : activity.badge_en;

            return (
              <div
                key={activity.id}
                draggable={!reordering}
                onDragStart={(e) => handleDragStart(e, activity, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  reordering ? 'opacity-50 cursor-wait' : 'cursor-move'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <button
                    className={`mt-1 text-gray-400 hover:text-gray-600 ${
                      reordering ? 'cursor-wait' : 'cursor-move'
                    }`}
                    title={t('programManagement.dragToReorder')}
                    disabled={reordering}
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
                          {activity.show_location_type_badge && (
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              (activity.location_type === 'exhibitor' || activity.location_type === 'company')
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {(activity.location_type === 'exhibitor' || activity.location_type === 'company') ? t('programManagement.exhibitor') : t('programManagement.venue')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditActivity(activity);
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('programManagement.edit')}
                        >
                          <MdEdit className="text-xl" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: activity.id, title })}
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

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('programManagement.confirmDelete')}
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-700">
            {t('programManagement.confirmDeleteMessage')}
          </p>
          <p className="mt-2 font-medium text-gray-900">
            "{deleteConfirm?.title}"
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={() => setDeleteConfirm(null)}
            disabled={deleting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('programManagement.cancel')}
          </button>
          <button
            onClick={() => handleDelete(deleteConfirm?.id)}
            disabled={deleting}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('programManagement.deleting')}
              </>
            ) : (
              t('programManagement.deleteButton')
            )}
          </button>
        </div>
      </Modal>

      {/* Activity Form Modal */}
      {showForm && (
        <ActivityForm
          activity={editActivity}
          day={activeTab}
          onSave={refetch}
          onClose={() => {
            setShowForm(false);
            setEditActivity(null);
          }}
        />
      )}
    </div>
  );
}
