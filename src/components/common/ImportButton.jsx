import React, { useState, Suspense, lazy } from 'react';
import Icon from '@mdi/react';
import { mdiUpload } from '@mdi/js';
import { getDataConfig } from '../../config/dataConfigs';
const ImportModal = lazy(() => import('./ImportModal'));

/**
 * ImportButton - Simple button that opens ImportModal
 *
 * @param {object} props
 * @param {string} props.dataType - Data type identifier (from DATA_TYPES)
 * @param {number} props.eventYear - Event year for year-dependent data (optional)
 * @param {Array} props.existingData - Existing records for matching (optional)
 * @param {object} props.additionalData - Additional data for import (e.g., markers, companies map)
 * @param {function} props.onImportComplete - Callback when import completes successfully
 * @param {function} props.onImportError - Callback when import fails
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.buttonClassName - Additional CSS classes for the button
 */
export default function ImportButton({
  dataType,
  eventYear,
  existingData = [],
  additionalData = {},
  onImportComplete,
  onImportError,
  className = '',
  buttonClassName = '',
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const config = getDataConfig(dataType);

  const handleImportComplete = (results) => {
    setIsModalOpen(false);
    if (onImportComplete) {
      onImportComplete(results);
    }
  };

  const handleImportError = (error) => {
    if (onImportError) {
      onImportError(error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={
          buttonClassName ||
          `flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${className}`
        }
        title={config.labels.importButton}
      >
        <Icon path={mdiUpload} size={0.8} />
        <span>Import</span>
      </button>

      <Suspense fallback={null}>
        <ImportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dataType={dataType}
          eventYear={eventYear}
          existingData={existingData}
          additionalData={additionalData}
          onImportComplete={handleImportComplete}
          onImportError={handleImportError}
        />
      </Suspense>
    </>
  );
}
