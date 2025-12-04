import React, { useState, useRef, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiDownload, mdiLoading, mdiChevronDown } from '@mdi/js';
import { useDialog } from '../../contexts/DialogContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../../utils/dataExportImport';
import { supabase as globalSupabase } from '../../supabaseClient';
import { getDataConfig } from '../../config/dataConfigs';
import useCategories from '../../hooks/useCategories';

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
  className = '',
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { toastSuccess, toastError } = useDialog();

  const config = getDataConfig(dataType);
  // in-memory categories available via hook — used as a fallback when Supabase is missing
  const { categories: inMemoryCategories, loading: categoriesLoading } = useCategories();

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

      // Special-case: companies export -> expand 'Categories' into per-category boolean columns
      // so users can select categories individually without editing the category names.
      let columnsToUse = config.exportColumns.slice();
      // Ensure the companies export expands categories no matter which component calls it
      // Prefer an explicitly provided supabase client via additionalData, otherwise fall
      // back to the app's global `supabase` singleton so export works everywhere. As a
      // final fallback, use the in-memory categories from the app state (useCategories)
      // so exports from the UI still include per-category columns even without Supabase
      const supabaseClient = additionalData?.supabase || globalSupabase;
      let categories = null;
      if (config.table === 'companies' && supabaseClient) {
        try {
          // Fetch current categories from database so the export always reflects live categories
          // Fetch categories and translations (name exists in category_translations)
          // Avoid selecting a non-existent top-level `name` column which causes 400 responses.
          const resp = await supabaseClient
            .from('categories')
            .select('slug, category_translations(language, name, title)')
            .order('sort_order');
          categories = resp && resp.data ? resp.data : null;

          if (
            (!Array.isArray(categories) || categories.length === 0) &&
            Array.isArray(inMemoryCategories) &&
            inMemoryCategories.length > 0
          ) {
            // prefer in-memory categories if Supabase returned nothing
            categories = inMemoryCategories.map((c) => ({
              slug: c.slug,
              category_translations: c.translations || [],
            }));
          }

          if (Array.isArray(categories) && categories.length > 0) {
            // Sort client-side by translated name (current app language not available here),
            // prefer 'nl' then fallback to first available translation, then slug.
            categories.sort((a, b) => {
              const aName =
                a.category_translations?.find((t) => t.language === 'nl')?.name ||
                a.category_translations?.[0]?.name ||
                a.slug ||
                '';
              const bName =
                b.category_translations?.find((t) => t.language === 'nl')?.name ||
                b.category_translations?.[0]?.name ||
                b.slug ||
                '';
              return String(aName).localeCompare(String(bName));
            });
            // find index of the original 'categories' placeholder column and replace it
            const placeholderIndex = columnsToUse.findIndex(
              (c) => c.key === 'categories' || c.header === 'Categories',
            );

            // Choose header name: prefer nl translation, fallback to first translation.name or slug
            const categoryCols = categories.map((cat) => {
              const header =
                cat.category_translations?.find((t) => t.language === 'nl')?.name ||
                cat.category_translations?.[0]?.name ||
                cat.slug;
              return { key: `category:${cat.slug}`, header, type: 'boolean' };
            });

            if (placeholderIndex >= 0) {
              // remove the original 'Categories' placeholder and append category columns
              columnsToUse.splice(placeholderIndex, 1);
            }
            // append category columns to the end so they don't split core fields
            columnsToUse.push(...categoryCols);

            // Fetch mappings of companies -> category slugs
            const companyIds = data.map((d) => d.id).filter(Boolean);
            const { data: companyCategories } = companyIds.length
              ? await supabaseClient
                  .from('company_categories')
                  .select('company_id, categories(slug)')
                  .in('company_id', companyIds)
              : { data: [] };

            const categoryMap = {};
            if (companyCategories) {
              companyCategories.forEach((cc) => {
                if (!categoryMap[cc.company_id]) categoryMap[cc.company_id] = [];
                if (cc.categories?.slug) categoryMap[cc.company_id].push(cc.categories.slug);
              });
            }

            // Post-process transformed export rows to add boolean flags per category
            exportData = exportData.map((row) => {
              const id = row.id;
              const slugs = categoryMap[id] || [];
              const newRow = { ...row };
              categories.forEach((cat) => {
                // Use visible symbols so spreadsheet UIs render a clear check/dash
                // and users can easily select values via the dropdown validation.
                // '+' represents selected, '-' represents not selected.
                newRow[`category:${cat.slug}`] = slugs.includes(cat.slug) ? '+' : '-';
              });
              return newRow;
            });
          }
        } catch (e) {
          console.error('Error expanding company categories for export:', e);
        }
      }

      let result;
      const baseFilename = getFilename();

      switch (format) {
        case 'excel':
          // Build metadata to help identify where category columns came from so
          // import/debugging can detect the source quickly.
          const categorySource =
            Array.isArray(categories) && categories.length > 0
              ? additionalData?.supabase
                ? 'supabase'
                : inMemoryCategories && inMemoryCategories.length
                  ? 'in-memory'
                  : 'unknown'
              : 'none';
          const categorySlugs = Array.isArray(categories) ? categories.map((c) => c.slug) : [];

          result = await exportToExcel(exportData, columnsToUse, baseFilename, {
            metadata: {
              category_source: categorySource,
              category_slugs: categorySlugs,
              format: 'wide',
            },
            freezeColumns: 2,
          });
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
        toastSuccess(
          `Successfully exported ${data.length} ${config.labels.plural.toLowerCase()} to ${format.toUpperCase()}`,
        );
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
              // Prevent exporting to Excel while categories are still loading — this avoids
              // the race condition where the dropdown is clicked before category columns
              // have been derived (and users would get a fallback 'Categories' CSV column).
              disabled={config.table === 'companies' && categoriesLoading}
              title={
                config.table === 'companies' && categoriesLoading
                  ? 'Categories are still loading — please wait to export Excel so category columns are included'
                  : undefined
              }
              className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 ${config.table === 'companies' && categoriesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-disabled={config.table === 'companies' && categoriesLoading}
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
