import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Modal from '../common/Modal';

/**
 * Lightweight confirmation modal shown when an admin changes the selected year.
 * It lists which datasets WILL switch and which datasets are global and will NOT switch.
 */
export default function YearChangeModal({ isOpen, onClose, newYear, onConfirm }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.yearSwitcher.modalTitle', { year: newYear })}
      size="md"
    >
      <div className="px-6 py-4 space-y-4 text-sm text-gray-700">
        <p>
          <Trans
            i18nKey="admin.yearSwitcher.modalIntro"
            values={{ year: newYear }}
            components={{ strong: <strong /> }}
          />
        </p>

        <ul className="list-disc list-inside text-sm">
          <li>
            <strong>{t('admin.yearSwitcher.willChange.subscriptions')}</strong> —{' '}
            {t('admin.yearSwitcher.willChange.subscriptionsDesc')}
          </li>
          <li>
            <strong>{t('admin.yearSwitcher.willChange.assignments')}</strong> —{' '}
            {t('admin.yearSwitcher.willChange.assignmentsDesc')}
          </li>
          <li>
            <strong>{t('admin.yearSwitcher.willChange.program')}</strong> —{' '}
            {t('admin.yearSwitcher.willChange.programDesc')}
          </li>
        </ul>

        <p className="text-gray-500">{t('admin.yearSwitcher.wontChangeIntro')}</p>
        <ul className="list-disc list-inside text-sm text-gray-500">
          <li>
            <strong>{t('admin.yearSwitcher.wontChange.companies')}</strong> —{' '}
            {t('admin.yearSwitcher.wontChange.companiesDesc')}
          </li>
        </ul>

        <div className="flex justify-end gap-3 mt-3">
          <button onClick={onClose} className="px-3 py-2 bg-white border rounded">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="px-3 py-2 bg-blue-600 text-white rounded">
            {t('admin.yearSwitcher.switchButton', { year: newYear })}
          </button>
        </div>
      </div>
    </Modal>
  );
}
