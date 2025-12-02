import React, { useState, useRef, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiDownload, mdiLoading, mdiChevronDown } from '@mdi/js';
import { useDialog } from '../../contexts/DialogContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../../utils/dataExportImport';
import { getDataConfig } from '../../config/dataConfigs';

/**
 * ExportButton - Reusable export button with format dropdown
 *
 * @param {object} props
 * @param {string} props.dataType - Data type identifier (from DATA_TYPES)
 * @param {Array} props.data - Array of records to export
 * @param {string} props.filename - Base filename (optional, auto-generated if not provided)
 * @param {object} props.additionalData - Additional data for export transforms (e.g., markers for assignments)
 * @param {function} props.onExportStart - Callback when export starts
 * @param {function} props.onExportComplete - Callback when export completes
 * @param {function} props.onExportError - Callback when export fails
 * @param {string} props.className - Additional CSS classes
 */
export default function ExportButton({
  dataType,
  data,
  filename,
  additionalData,
  onExportStart,
  onExportComplete,
  onExportError,
  className = ''
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { toastSuccess, toastError } = useDialog();

  const config = getDataConfig(dataType);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Generate filename with timestamp
  const getFilename = () => {
    if (filename) return filename;
    const timestamp = new Date().toISOString().split('T')[0];
    return `${config.labels.exportFilename}-${timestamp}`;
  };

  // Handle export
  const handleExport = async (format) => {
    setShowDropdown(false);

    if (!data || data.length === 0) {
      toastError('No data to export');
      return;
    }

    setIsExporting(true);
    if (onExportStart) onExportStart(format);

    try {
      // Transform data if needed
      let exportData = data;
      if (config.transformExport) {
        exportData = await config.transformExport(data, additionalData);
      }

      let result;
      const baseFilename = getFilename();

      switch (format) {
        case 'excel':
          result = await exportToExcel(exportData, config.exportColumns, baseFilename);
          break;
        case 'csv':
          result = await exportToCSV(exportData, config.exportColumns, baseFilename);
          break;
        case 'json':
          result = await exportToJSON(exportData, baseFilename);
          break;
        default:
          throw new Error(`Unknown export format: ${format}`);
      }

      if (result.success) {
        toastSuccess(`Successfully exported ${data.length} ${config.labels.plural.toLowerCase()} to ${format.toUpperCase()}`);
        if (onExportComplete) onExportComplete(format, baseFilename);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toastError(`Export failed: ${error.message}`);
      if (onExportError) onExportError(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting || !data || data.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={config.labels.exportButton}
      >
        {isExporting ? (
          <>
            <Icon path={mdiLoading} size={0.8} spin />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Icon path={mdiDownload} size={0.8} />
            <span>Export</span>
            <Icon path={mdiChevronDown} size={0.6} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && !isExporting && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleExport('excel')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span>📊</span>
              <span>Export as Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span>📄</span>
              <span>Export as CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span>🔧</span>
              <span>Export as JSON</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
