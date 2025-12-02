import React, { useState, useRef } from 'react';
import Icon from '@mdi/react';
import {
  mdiFileUpload,
  mdiLoading,
  mdiCheck,
  mdiAlert,
  mdiRefresh,
  mdiClose,
  mdiCheckCircle,
  mdiAlertCircle
} from '@mdi/js';
import Modal from './Modal';
import { useDialog } from '../../contexts/DialogContext';
import { parseFile, matchRecords, buildLookupMap, sanitizeDbPayload } from '../../utils/dataExportImport';
import { getDataConfig } from '../../config/dataConfigs';
import { supabase } from '../../supabaseClient';

const STEPS = {
  FILE_SELECT: 'file_select',
  PARSING: 'parsing',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  COMPLETE: 'complete'
};

/**
 * ImportModal - Full-featured import modal with preview and validation
 *
 * Multi-step flow: File Select → Parse → Validate → Preview → Import → Complete
 */
export default function ImportModal({
  isOpen,
  onClose,
  dataType,
  eventYear,
  existingData = [],
  additionalData = {},
  onImportComplete,
  onImportError
}) {
  const [step, setStep] = useState(STEPS.FILE_SELECT);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsedMeta, setParsedMeta] = useState(null);
  const [validatedRows, setValidatedRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [suppressToasts, setSuppressToasts] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });

  const fileInputRef = useRef(null);
  const { toastError, toastSuccess, toastWarning } = useDialog();
  const config = getDataConfig(dataType);

  // Reset state when modal closes
  const handleClose = () => {
    setStep(STEPS.FILE_SELECT);
    setSelectedFile(null);
    setParsedRows([]);
    setValidatedRows([]);
    setSelectedRows(new Set());
    setImportResults(null);
    setError(null);
    setSuppressToasts(false);
    setImportProgress({ current: 0, total: 0, message: '' });
    onClose();
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setStep(STEPS.PARSING);

    // Parse file (parseFile now returns optional metadata for XLSX files)
    const { data, error: parseError, metadata } = await parseFile(file);

    if (parseError || !data) {
      setError(parseError || 'Failed to parse file');
      setStep(STEPS.FILE_SELECT);
      if (!suppressToasts) {
        toastError(`Failed to parse file: ${parseError}`);
      }
      return;
    }

    if (data.length === 0) {
      setError('File is empty or has no valid data');
      setStep(STEPS.FILE_SELECT);
      if (!suppressToasts) {
        toastError('File is empty');
      }
      return;
    }

    setParsedRows(data);
    // Save metadata (if present) so the preview can render per-category columns
    setParsedMeta(metadata || null);
    // Note: parseFile now returns metadata on Excel; the returned object is
    // { data, error, metadata } — but older code path may only provide data.
    // We'll instead re-run the parseFile call to destructure metadata properly
    // below. (See further handling immediately after.)

    // Validate and match records
    await validateAndMatch(data);
  };

  // Validate and match records
  const validateAndMatch = async (data) => {
    try {
      // Build lookup maps if needed for validation
      let companyMap = null;
      let markerMap = null;

      if (config.yearDependent) {
        // Fetch companies for subscriptions and assignments
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name');

        if (companiesError) throw companiesError;

        companyMap = buildLookupMap(companies, 'name', 'id', false);

        // For assignments, also fetch markers
        if (dataType === 'assignments') {
          const { data: markers, error: markersError } = await supabase
            .from('markers_core')
            .select('id, glyph')
            .eq('event_year', eventYear);

          if (markersError) throw markersError;

          // Build marker map with both glyph and id as keys
          markerMap = {};
          markers.forEach(m => {
            if (m.glyph) {
              markerMap[m.glyph.toLowerCase()] = m.id;
            }
            markerMap[m.id.toString()] = m.id;
          });
        }
      }

      // Validate each row
      const validated = data.map((row, index) => {
        const validation = config.validateRow(row, index, companyMap, markerMap);

        // Determine action (CREATE, UPDATE, ERROR)
        let action = 'ERROR';
        let matchedRecord = null;

        if (validation.valid) {
          // Try to match with existing data
          try {
            const transformed = config.transformImport(
              row,
              companyMap,
              markerMap || additionalData.markerMap,
              eventYear
            );

            // Match against existing data
            if (config.matchStrategy.matchFields.includes('name')) {
              // Companies matching by name
              const matchName = row['Company Name']?.toLowerCase().trim();
              matchedRecord = existingData.find(e =>
                e.name?.toLowerCase().trim() === matchName
              );
            } else if (config.yearDependent && companyMap) {
              // Subscriptions/assignments matching
              const companyName = row['Company Name']?.toLowerCase().trim();
              const companyId = companyMap[companyName];

              if (dataType === 'event_subscriptions') {
                matchedRecord = existingData.find(e =>
                  e.company_id === companyId && e.event_year === eventYear
                );
              } else if (dataType === 'assignments') {
                const boothLabel = row['Booth Label']?.toLowerCase().trim();
                const markerId = markerMap[boothLabel];
                matchedRecord = existingData.find(e =>
                  e.company_id === companyId &&
                  e.marker_id === markerId &&
                  e.event_year === eventYear
                );
              }
            }

            action = matchedRecord ? 'UPDATE' : 'CREATE';
          } catch (transformError) {
            validation.valid = false;
            validation.errors.push({
              field: 'General',
              message: transformError.message
            });
          }
        }

        return {
          index,
          originalRow: row,
          validation,
          action,
          matchedRecord,
          selected: validation.valid // Auto-select valid rows
        };
      });

      setValidatedRows(validated);

      // Auto-select all valid rows
      const validIndices = validated
        .filter(r => r.validation.valid)
        .map(r => r.index);
      setSelectedRows(new Set(validIndices));

      setStep(STEPS.PREVIEW);

      // Show summary only if not suppressed
      if (!suppressToasts) {
        const validCount = validated.filter(r => r.validation.valid).length;
        const errorCount = validated.filter(r => !r.validation.valid).length;

        if (errorCount > 0) {
          toastWarning(`Parsed ${data.length} rows: ${validCount} valid, ${errorCount} errors`);
        } else {
          toastSuccess(`Parsed ${data.length} rows - all valid`);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError(error.message);
      setStep(STEPS.FILE_SELECT);
      toastError(`Validation failed: ${error.message}`);
    }
  };

  // Toggle row selection
  const toggleRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Toggle all valid rows
  const toggleAll = () => {
    if (selectedRows.size === validatedRows.filter(r => r.validation.valid).length) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all valid
      const validIndices = validatedRows
        .filter(r => r.validation.valid)
        .map(r => r.index);
      setSelectedRows(new Set(validIndices));
    }
  };

  // Helper: Assign categories to company
  const assignCompanyCategories = async (companyId, categorySlugs, categorySlugToIdMap, errors) => {
    if (!categorySlugs || categorySlugs.length === 0) return;

    try {
      // Map slugs to IDs
      const categoryIds = categorySlugs
        .map(slug => categorySlugToIdMap[slug.toLowerCase()])
        .filter(id => id !== undefined);

      if (categoryIds.length === 0) return; // No valid categories

      // Delete existing assignments
      await supabase
        .from('company_categories')
        .delete()
        .eq('company_id', companyId);

      // Add new assignments
      const assignments = categoryIds.map(categoryId => ({
        company_id: companyId,
        category_id: categoryId
      }));

      const { error } = await supabase
        .from('company_categories')
        .insert(assignments);

      if (error) {
        errors.push({
          type: 'CATEGORY',
          companyId,
          message: `Failed to assign categories: ${error.message}`
        });
      }
    } catch (error) {
      errors.push({
        type: 'CATEGORY',
        companyId,
        message: `Failed to assign categories: ${error.message}`
      });
    }
  };

  // Helper: Save company translations
  const saveCompanyTranslations = async (companyId, translations, errors) => {
    if (!translations) return;

    const translationRecords = [];

    // Build translation records for each language
    if (translations.nl && translations.nl.trim()) {
      translationRecords.push({
        company_id: companyId,
        language_code: 'nl',
        info: translations.nl.trim(),
        updated_at: new Date().toISOString()
      });
    }

    if (translations.en && translations.en.trim()) {
      translationRecords.push({
        company_id: companyId,
        language_code: 'en',
        info: translations.en.trim(),
        updated_at: new Date().toISOString()
      });
    }

    if (translations.de && translations.de.trim()) {
      translationRecords.push({
        company_id: companyId,
        language_code: 'de',
        info: translations.de.trim(),
        updated_at: new Date().toISOString()
      });
    }

    // Upsert translations (insert or update)
    if (translationRecords.length > 0) {
      const { error } = await supabase
        .from('company_translations')
        .upsert(translationRecords, {
          onConflict: 'company_id,language_code'
        });

      if (error) {
        errors.push({
          type: 'TRANSLATION',
          companyId,
          message: `Failed to save translations: ${error.message}`
        });
      }
    }
  };

  // Execute import
  const handleImport = async () => {
    const rowsToImport = validatedRows.filter(r => selectedRows.has(r.index));

    if (rowsToImport.length === 0) {
      toastError('No rows selected for import');
      return;
    }

    setStep(STEPS.IMPORTING);

    // Initialize progress tracking
    setImportProgress({ current: 0, total: rowsToImport.length, message: 'Starting import...' });

    try {
      // Build lookup maps for transforms
      let companyMap = null;
      let markerMap = null;

      if (config.yearDependent) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name');
        companyMap = buildLookupMap(companies, 'name', 'id', false);

        if (dataType === 'assignments') {
          const { data: markers } = await supabase
            .from('markers_core')
            .select('id, glyph')
            .eq('event_year', eventYear);
          markerMap = {};
          markers.forEach(m => {
            if (m.glyph) markerMap[m.glyph.toLowerCase()] = m.id;
            markerMap[m.id.toString()] = m.id;
          });
        }
      }

      // For companies: Build category slug-to-ID map
      let categorySlugToIdMap = {};
      if (dataType === 'companies') {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, slug');

        if (!categoriesError && categories) {
          categories.forEach(cat => {
            categorySlugToIdMap[cat.slug.toLowerCase()] = cat.id;
          });
        }
      }

      // Get user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      const created_by = user?.email || 'unknown';

      // Separate creates and updates.
      // We'll keep parallel arrays: sanitized payloads for DB, and originals for
      // post-import actions (translations, category assignments).
      const creates = [];
      const createsMeta = [];
      const updates = [];
      const updatesMeta = [];

      for (const row of rowsToImport) {
        const transformed = config.transformImport(
          row.originalRow,
          companyMap,
          markerMap,
          eventYear
        );

        if (row.action === 'CREATE') {
          // Add event_year if needed
          if (config.yearDependent && !transformed.event_year) {
            transformed.event_year = eventYear;
          }
          // Add created_by if table supports it
          if (config.yearDependent) {
            transformed.created_by = created_by;
          }
          // Keep a sanitized copy for DB insert (remove internal keys)
          const dbPayload = sanitizeDbPayload(transformed);
          creates.push(dbPayload);
          createsMeta.push(transformed);
        } else if (row.action === 'UPDATE') {
          const dbPayload = sanitizeDbPayload(transformed);
          updates.push({ id: row.matchedRecord.id, data: dbPayload });
          updatesMeta.push({ id: row.matchedRecord.id, original: transformed });
        }
      }

      let createdCount = 0;
      let updatedCount = 0;
      const errors = [];

      // Batch insert creates
      if (creates.length > 0) {
        setImportProgress({ 
          current: 0, 
          total: rowsToImport.length, 
          message: `Creating ${creates.length} new records...` 
        });

        const { data, error } = await supabase
          .from(config.table)
          .insert(creates)
          .select();

        if (error) {
          errors.push({ type: 'CREATE_BATCH', message: error.message });
        } else {
          createdCount = data?.length || 0;
          setImportProgress({ 
            current: createdCount, 
            total: rowsToImport.length, 
            message: `Created ${createdCount} records. Processing additional data...` 
          });

          // For companies: Save translations and assign categories after successful creation
          if (dataType === 'companies' && data) {
            for (let i = 0; i < data.length; i++) {
              const company = data[i];
              const originalData = createsMeta[i];

              if (originalData && originalData._translations) {
                await saveCompanyTranslations(company.id, originalData._translations, errors);
              }

              if (originalData && originalData._categorySlugs) {
                await assignCompanyCategories(company.id, originalData._categorySlugs, categorySlugToIdMap, errors);
              }
            }
          }
        }
      }

      // Individual updates (Supabase doesn't support batch updates with different values)
      setImportProgress({ 
        current: createdCount, 
        total: rowsToImport.length, 
        message: `Updating ${updates.length} existing records...` 
      });

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const progressPercent = Math.round(((createdCount + i) / rowsToImport.length) * 100);
        
        setImportProgress({ 
          current: createdCount + i, 
          total: rowsToImport.length, 
          message: `Updating record ${i + 1} of ${updates.length}... (${progressPercent}%)` 
        });

        const { error } = await supabase
          .from(config.table)
          .update(update.data)
          .eq('id', update.id);

        if (error) {
          errors.push({ type: 'UPDATE', id: update.id, message: error.message });
        } else {
          updatedCount++;

          // For companies: Save translations and assign categories after successful update
          if (dataType === 'companies') {
            const orig = updatesMeta.find(u => u.id === update.id)?.original || null;
            if (orig && orig._translations) {
              await saveCompanyTranslations(update.id, orig._translations, errors);
            }
            if (orig && orig._categorySlugs) {
              await assignCompanyCategories(update.id, orig._categorySlugs, categorySlugToIdMap, errors);
            }
          }
        }
      }

      // Set results
      setImportResults({
        created: createdCount,
        updated: updatedCount,
        failed: errors.length,
        errors
      });

      setStep(STEPS.COMPLETE);

      // Show toast
      if (errors.length === 0) {
        toastSuccess(
          `Import complete: ${createdCount} created, ${updatedCount} updated`
        );
        if (onImportComplete) {
          onImportComplete({ created: createdCount, updated: updatedCount });
        }
      } else {
        toastWarning(
          `Import partial: ${createdCount} created, ${updatedCount} updated, ${errors.length} failed`
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(error.message);
      toastError(`Import failed: ${error.message}`);
      if (onImportError) onImportError(error);
      setStep(STEPS.PREVIEW);
    }
  };

  // Memoized step content renderer to prevent unnecessary re-renders
  const renderStepContent = React.useMemo(() => function() {
    switch (step) {
      case STEPS.FILE_SELECT:
        return (
          <div className="p-6 transition-all duration-200 ease-in-out">
            <div className="text-center">
              <Icon path={mdiFileUpload} size={3} className="mx-auto text-gray-400 mb-4 transition-transform duration-200" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Select a file to import
              </h4>
              <p className="text-sm text-gray-600 mb-6">
                Supported formats: Excel (.xlsx), CSV (.csv), JSON (.json)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                Choose File
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-pulse">
                  {error}
                </div>
              )}
            </div>
          </div>
        );

      case STEPS.PARSING:
        return (
          <div className="p-6 transition-all duration-200 ease-in-out">
            <div className="text-center">
              <Icon path={mdiLoading} size={3} className="mx-auto text-blue-600 mb-4 transition-transform duration-200" spin />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Parsing file...
              </h4>
              <p className="text-sm text-gray-600">
                Please wait while we process your file
              </p>
            </div>
          </div>
        );

      case STEPS.PREVIEW:
        return (
          <div className="flex flex-col h-full transition-all duration-200 ease-in-out">
            {/* Summary */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Import Preview
                  </h4>
                  <p className="text-sm text-gray-600">
                    {validatedRows.length} rows parsed,{' '}
                    {validatedRows.filter(r => r.validation.valid).length} valid,{' '}
                    {validatedRows.filter(r => !r.validation.valid).length} errors
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === validatedRows.filter(r => r.validation.valid).length && selectedRows.size > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                    <span>Select All ({selectedRows.size} selected)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="transition-all duration-200 ease-in-out">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 font-medium text-gray-700">Select</th>
                      <th className="text-left p-2 font-medium text-gray-700">Row</th>
                      <th className="text-left p-2 font-medium text-gray-700">Status</th>
                      {(() => {
                          // Build preview columns: default to first 4 configured export columns
                          // but also append per-category columns if the parsed file provided metadata
                          const base = config.exportColumns.slice(0, 4)
                          const extra = (parsedMeta && Array.isArray(parsedMeta.columns))
                            ? parsedMeta.columns.filter(c => c.key && String(c.key).startsWith('category:'))
                            : []
                          const previewCols = [...base, ...extra]
                          return previewCols.map(col => (
                            <th key={col.key} className="text-left p-2 font-medium text-gray-700">
                              {col.header}
                            </th>
                          ))
                        })()}
                      <th className="text-left p-2 font-medium text-gray-700">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRows.map((row) => (
                      <tr
                        key={row.index}
                        className={`border-b border-gray-100 transition-colors duration-150 ${
                          row.validation.valid ? 'hover:bg-gray-50' : 'bg-red-50'
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.index)}
                            onChange={() => toggleRow(row.index)}
                            disabled={!row.validation.valid}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2 text-gray-600">{row.index + 1}</td>
                        <td className="p-2">
                          {row.validation.valid ? (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                              row.action === 'CREATE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              <Icon
                                path={row.action === 'CREATE' ? mdiCheck : mdiRefresh}
                                size={0.5}
                              />
                              {row.action}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                              <Icon path={mdiAlert} size={0.5} />
                              ERROR
                            </span>
                          )}
                        </td>
                        {(() => {
                          const base = config.exportColumns.slice(0, 4)
                          const extra = (parsedMeta && Array.isArray(parsedMeta.columns))
                            ? parsedMeta.columns.filter(c => c.key && String(c.key).startsWith('category:'))
                            : []
                          const previewCols = [...base, ...extra]
                          return previewCols.map(col => (
                            <td key={col.key} className="p-2 text-gray-900 truncate max-w-xs">
                              {row.originalRow[col.header] || '-'}
                            </td>
                          ))
                        })()}
                        <td className="p-2">
                          {row.validation.errors.length > 0 && (
                            <div className="text-xs text-red-600">
                              {row.validation.errors.map((err, i) => (
                                <div key={i}>• {err.message}</div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-between flex-shrink-0">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedRows.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Import Selected ({selectedRows.size})
              </button>
            </div>
          </div>
        );

      case STEPS.IMPORTING:
        const progressPercent = importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0;
        return (
          <div className="p-6 transition-all duration-200 ease-in-out">
            <div className="text-center">
              <div className="w-full max-w-md mx-auto">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Importing data...
                </h4>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                
                {/* Progress Details */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {importProgress.message || `Processing ${selectedRows.size} records`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {importProgress.current} of {importProgress.total} records ({progressPercent}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case STEPS.COMPLETE:
        return (
          <div className="p-6 transition-all duration-200 ease-in-out">
            <div className="text-center">
              {importResults.failed === 0 ? (
                <Icon path={mdiCheckCircle} size={3} className="mx-auto text-green-600 mb-4 transition-transform duration-200" />
              ) : (
                <Icon path={mdiAlertCircle} size={3} className="mx-auto text-orange-600 mb-4 transition-transform duration-200" />
              )}
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Import Complete
              </h4>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 transition-colors duration-200">
                  <span className="text-green-600">✓ Created:</span>
                  <span className="font-medium">{importResults.created}</span>
                </div>
                <div className="flex items-center justify-center gap-2 transition-colors duration-200">
                  <span className="text-blue-600">⟳ Updated:</span>
                  <span className="font-medium">{importResults.updated}</span>
                </div>
                {importResults.failed > 0 && (
                  <div className="flex items-center justify-center gap-2 transition-colors duration-200">
                    <span className="text-red-600">✗ Failed:</span>
                    <span className="font-medium">{importResults.failed}</span>
                  </div>
                )}
              </div>

              {importResults.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left text-sm transition-colors duration-200">
                  <div className="font-medium text-red-900 mb-2">Errors:</div>
                  {importResults.errors.map((err, i) => (
                    <div key={i} className="text-red-700">
                      • {err.message}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [step, config, selectedRows, validatedRows, parsedMeta, selectedFile, error, importResults, importProgress]);

  // Call the memoized function
  const stepContent = renderStepContent();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={config.labels.modalTitle}
      size="lg"
      closeOnBackdrop={step !== STEPS.IMPORTING}
      className="transition-all duration-200 ease-in-out"
    >
      <div className="transition-all duration-200 ease-in-out">
        {stepContent}
      </div>
    </Modal>
  );
}
