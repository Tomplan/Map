import React from 'react';
import Modal from '../common/Modal';

/**
 * Lightweight confirmation modal shown when an admin changes the selected year.
 * It lists which datasets WILL switch and which datasets are global and will NOT switch.
 */
export default function YearChangeModal({ isOpen, onClose, newYear, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Switch to ${newYear}?`} size="md">
      <div className="px-6 py-4 space-y-4 text-sm text-gray-700">
        <p>
          Are you sure you want to switch the admin view to <strong>{newYear}</strong>? The following data will update to reflect the selected year:
        </p>

        <ul className="list-disc list-inside text-sm">
          <li><strong>Subscriptions</strong> — registrations and meal/coin selections for that event year</li>
          <li><strong>Assignments</strong> — booth assignments and marker-to-company mappings for that year</li>
          <li><strong>Program Management</strong> — the schedule / activities for the selected year</li>
        </ul>

        <p className="text-gray-500">The following data is <em>not</em> affected when switching years:</p>
        <ul className="list-disc list-inside text-sm text-gray-500">
          <li><strong>Companies</strong> — company profiles and master data are global and shared across years</li>
        </ul>

        <div className="flex justify-end gap-3 mt-3">
          <button onClick={onClose} className="px-3 py-2 bg-white border rounded">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 bg-blue-600 text-white rounded">Switch to {newYear}</button>
        </div>
      </div>
    </Modal>
  );
}
