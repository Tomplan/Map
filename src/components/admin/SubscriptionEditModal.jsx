import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import useAssignments from '../../hooks/useAssignments';
import { useMarkerGlyphs } from '../../hooks/useMarkerGlyphs';

/**
 * SubscriptionEditModal - Modal for editing subscription details
 * Provides a better UX than inline editing with organized form sections
 */
export default function SubscriptionEditModal({ onClose, subscription, onSave }) {
  const { t } = useTranslation();
  const { organizationLogo } = useOrganizationLogo();
  const [editForm, setEditForm] = useState({
    booth_count: subscription.booth_count || 1,
    area: subscription.area || '',
    breakfast_sat: subscription.breakfast_sat || 0,
    lunch_sat: subscription.lunch_sat || 0,
    bbq_sat: subscription.bbq_sat || 0,
    breakfast_sun: subscription.breakfast_sun || 0,
    lunch_sun: subscription.lunch_sun || 0,
    coins: subscription.coins || 0,
    notes: subscription.notes || '',
  });

  // Get booth assignments for display context (use current year as fallback)
  const eventYear = subscription?.event_year || new Date().getFullYear();
  const { assignments } = useAssignments(eventYear);
  const { markers } = useMarkerGlyphs(eventYear);

  // Build marker glyph map
  const markerGlyphMap = useMemo(() => {
    const map = {};
    markers.forEach((marker) => {
      map[marker.id] = marker.glyph;
    });
    return map;
  }, [markers]);

  // Get booth labels for this subscription
  const boothLabels = useMemo(() => {
    if (!subscription || !assignments) return '-';

    const companyAssignments = assignments.filter((a) => a.company_id === subscription.company_id);

    if (companyAssignments.length === 0) return '-';

    const labels = companyAssignments
      .sort((a, b) => a.marker_id - b.marker_id)
      .map((assignment) => markerGlyphMap[assignment.marker_id] || assignment.marker_id.toString())
      .filter(Boolean);

    return labels.length > 0 ? labels.join(', ') : '-';
  }, [subscription, assignments, markerGlyphMap]);

  // Helper: update a field — always uses functional updater to avoid stale closures
  const setField = (field, value) => setEditForm((f) => ({ ...f, [field]: value }));
  const setNum = (field, raw) => setField(field, raw === '' ? '' : (parseInt(raw) || 0));

  const handleSave = async () => {
    // Coerce any empty-string fields back to numbers before saving
    const cleaned = { ...editForm };
    for (const k of ['booth_count', 'breakfast_sat', 'lunch_sat', 'bbq_sat', 'breakfast_sun', 'lunch_sun', 'coins']) {
      cleaned[k] = Number(cleaned[k]) || 0;
    }
    if (cleaned.booth_count < 1) cleaned.booth_count = 1;
    await onSave(cleaned);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Edit Subscription: ${subscription.company?.name || ''}`}
      size="lg"
    >
      <div className="p-6">
        {/* Company Context Header */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <img
              {...(() => {
                const source = subscription.company?.logo || organizationLogo;
                const r = getResponsiveLogoSources(source);
                if (r) return { src: r.src, srcSet: r.srcSet, sizes: r.sizes };
                return { src: getLogoPath(source) };
              })()}
              alt={subscription.company?.name}
              className="w-16 h-16 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{subscription.company?.name}</h3>
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.booth_count ?? ''}
                onChange={(e) => setNum('booth_count', e.target.value)}
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
                onChange={(e) => setField('area', e.target.value)}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.breakfast_sat ?? ''}
                onChange={(e) => setNum('breakfast_sat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.lunch')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.lunch_sat ?? ''}
                onChange={(e) => setNum('lunch_sat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.bbq')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.bbq_sat ?? ''}
                onChange={(e) => setNum('bbq_sat', e.target.value)}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.breakfast_sun ?? ''}
                onChange={(e) => setNum('breakfast_sun', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.lunch')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.lunch_sun ?? ''}
                onChange={(e) => setNum('lunch_sun', e.target.value)}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.coins ?? ''}
                onChange={(e) => setNum('coins', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('helpPanel.subscriptions.notes')}
              </label>
              <textarea
                value={editForm.notes || ''}
                onChange={(e) => setField('notes', e.target.value)}
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
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
