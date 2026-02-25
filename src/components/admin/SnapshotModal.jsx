import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiContentSave, mdiRestore, mdiDelete, mdiClockOutline, mdiPlus } from '@mdi/js';
import useMapSnapshots from '../../hooks/useMapSnapshots';

export default function SnapshotModal({ isOpen, onClose, eventYear, onRestore }) {
  const { t } = useTranslation();
  const {
    snapshots,
    loading,
    error,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
  } = useMapSnapshots(eventYear);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDesc, setNewSnapshotDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, loadSnapshots]);

  const handleCreate = async () => {
    if (!newSnapshotName.trim()) return;
    const success = await createSnapshot(newSnapshotName, newSnapshotDesc);
    if (success) {
      setNewSnapshotName('');
      setNewSnapshotDesc('');
      setIsCreating(false);
    }
  };

  const handleRestore = async (snapshotId) => {
    const success = await restoreSnapshot(snapshotId);
    if (success) {
      onRestore && onRestore(); // Notify parent to refresh map
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('snapshots.manageSnapshots', 'Manage Map Snapshots')}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Create New Snapshot Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Icon path={mdiPlus} size={0.8} />
              {t('snapshots.createNew', 'Create New Snapshot')}
            </h3>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('snapshots.name', 'Snapshot Name')}
              </label>
              <input
                type="text"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                placeholder="e.g. Layout V1 - Initial Draft"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('snapshots.description', 'Description (Optional)')}
              </label>
              <textarea
                value={newSnapshotDesc}
                onChange={(e) => setNewSnapshotDesc(e.target.value)}
                placeholder="Brief notes about this version..."
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={loading || !newSnapshotName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Icon path={mdiContentSave} size={0.8} />
                {t('snapshots.saveCurrentState', 'Save Current State')}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Snapshots List */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Icon path={mdiClockOutline} size={0.8} />
            {t('snapshots.history', 'Snapshot History')}
          </h3>

          {loading && !snapshots.length ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">
              {t('snapshots.noSnapshots', 'No saved snapshots found for this year.')}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-start justify-between p-4 bg-white border rounded-lg hover:border-blue-300 transition-colors shadow-sm"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{snap.name}</h4>
                    {snap.description && (
                      <p className="text-sm text-gray-600 mt-1">{snap.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                      <span>{new Date(snap.created_at).toLocaleString()}</span>
                      {snap.created_by && <span>• by User</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(snap.id)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded tooltip-trigger"
                      title={t('snapshots.restore', 'Restore this version')}
                    >
                      <Icon path={mdiRestore} size={1} />
                    </button>
                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded tooltip-trigger"
                      title={t('common.delete', 'Delete')}
                    >
                      <Icon path={mdiDelete} size={1} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
