import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import PhoneInput from '../common/PhoneInput';
import { getLogoPath } from '../../utils/getLogoPath';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import useAssignments from '../../hooks/useAssignments';
import { useMarkerGlyphs } from '../../hooks/useMarkerGlyphs';

/**
 * SubscriptionEditModal - Modal for editing subscription details
 * Provides a better UX than inline editing with organized form sections
 */
export default function SubscriptionEditModal({
  isOpen,
  onClose,
  subscription,
  onSave
}) {
  const { t } = useTranslation();
  const { organizationLogo } = useOrganizationLogo();
  const [editForm, setEditForm] = useState({});

  // Get booth assignments for display context (use current year as fallback)
  const eventYear = subscription?.event_year || new Date().getFullYear();
  const { assignments } = useAssignments(eventYear);
  const { markers } = useMarkerGlyphs(eventYear);

  // Build marker glyph map
  const markerGlyphMap = useMemo(() => {
    const map = {};
    markers.forEach(marker => {
      map[marker.id] = marker.glyph;
    });
    return map;
  }, [markers]);

  // Get booth labels for this subscription
  const boothLabels = useMemo(() => {
    if (!subscription || !assignments) return '-';

    const companyAssignments = assignments.filter(
      a => a.company_id === subscription.company_id
    );

    if (companyAssignments.length === 0) return '-';

    const labels = companyAssignments
      .sort((a, b) => a.marker_id - b.marker_id)
      .map(assignment => markerGlyphMap[assignment.marker_id] || assignment.marker_id.toString())
      .filter(Boolean);

    return labels.length > 0 ? labels.join(', ') : '-';
  }, [subscription, assignments, markerGlyphMap]);

  // Initialize form when subscription changes
  useEffect(() => {
    if (subscription) {
      setEditForm({
        contact: subscription.contact || '',
        phone: subscription.phone || '',
        email: subscription.email || '',
        booth_count: subscription.booth_count || 1,
        area: subscription.area || '',
        breakfast_sat: subscription.breakfast_sat || 0,
        lunch_sat: subscription.lunch_sat || 0,
        bbq_sat: subscription.bbq_sat || 0,
        breakfast_sun: subscription.breakfast_sun || 0,
        lunch_sun: subscription.lunch_sun || 0,
        coins: subscription.coins || 0,
        notes: subscription.notes || ''
      });
    }
  }, [subscription]);

  const handleSave = async () => {
    await onSave(editForm);
  };

  if (!subscription) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Subscription: ${subscription.company?.name || ''}`}
      size="lg"
    >
      <div className="p-6">
        {/* Company Context Header */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <img
              src={getLogoPath(subscription.company?.logo || organizationLogo)}
              alt={subscription.company?.name}
              className="w-16 h-16 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">
                {subscription.company?.name}
              </h3>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Event Year:</span> {subscription.event_year}
              </div>
              {boothLabels !== '-' && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Current Booths:</span>{' '}
                  <span className="text-blue-600 font-medium">{boothLabels}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-3 text-green-800">
            {t('helpPanel.subscriptions.contactInformation')}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.contact')}
              </label>
              <input
                type="text"
                value={editForm.contact || ''}
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contact person name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.phone')}
              </label>
              <PhoneInput
                value={editForm.phone || ''}
                onChange={(value) => setEditForm({ ...editForm, phone: value })}
                placeholder="+31612345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.email')}
              </label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Event Logistics Section */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-3 text-blue-800">
            {t('helpPanel.subscriptions.eventLogistics')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.boothCount')}
              </label>
              <input
                type="number"
                min="1"
                value={editForm.booth_count || 1}
                onChange={(e) => setEditForm({ ...editForm, booth_count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.area')}
              </label>
              <input
                type="text"
                value={editForm.area || ''}
                onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('helpPanel.subscriptions.areaPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Saturday Meals Section */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-3 text-blue-800">
            {t('helpPanel.subscriptions.saturday')} - {t('helpPanel.subscriptions.meals')}
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.breakfast')}
              </label>
              <input
                type="number"
                min="0"
                value={editForm.breakfast_sat || 0}
                onChange={(e) => setEditForm({ ...editForm, breakfast_sat: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.lunch')}
              </label>
              <input
                type="number"
                min="0"
                value={editForm.lunch_sat || 0}
                onChange={(e) => setEditForm({ ...editForm, lunch_sat: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.bbq')}
              </label>
              <input
                type="number"
                min="0"
                value={editForm.bbq_sat || 0}
                onChange={(e) => setEditForm({ ...editForm, bbq_sat: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sunday Meals Section */}
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-3 text-green-800">
            {t('helpPanel.subscriptions.sunday')} - {t('helpPanel.subscriptions.meals')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.breakfast')}
              </label>
              <input
                type="number"
                min="0"
                value={editForm.breakfast_sun || 0}
                onChange={(e) => setEditForm({ ...editForm, breakfast_sun: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.lunch')}
              </label>
              <input
                type="number"
                min="0"
                value={editForm.lunch_sun || 0}
                onChange={(e) => setEditForm({ ...editForm, lunch_sun: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-3 text-gray-800">
            {t('helpPanel.subscriptions.additionalInfo')}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.coins')}
              </label>
              <input
                type="number"
                min="0"
                value={editForm.coins || 0}
                onChange={(e) => setEditForm({ ...editForm, coins: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.notes')}
              </label>
              <textarea
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
