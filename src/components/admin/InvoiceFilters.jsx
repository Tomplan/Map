import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiCheckCircle,
  mdiAlertCircle,
  mdiDomain,
  mdiClose,
  mdiPlus,
  mdiUpload,
  mdiTableColumn,
  mdiCheck,
  mdiMinus,
} from '@mdi/js';
import useOrganizationSettings from '../../hooks/useOrganizationSettings';
import { useDialog } from '../../contexts/DialogContext';
import * as XLSX from 'xlsx';

export default function InvoiceFilters() {
  const { t } = useTranslation();
  const { settings, loading, updateSetting } = useOrganizationSettings();
  const { toastError, toastWarning } = useDialog();

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // CSV/Excel Import State
  const [importedData, setImportedData] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [extractedItems, setExtractedItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setItems(settings.invoice_allowed_items || []);
    }
  }, [settings]);

  const handleSave = async (updatedItems) => {
    setError(null);
    setSaving(true);
    try {
      await updateSetting('invoice_allowed_items', updatedItems);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update allowed items', err);
      if (err.message?.includes('updated by another admin')) {
        toastWarning(err.message);
      } else {
        toastError(err.message || 'Failed to save settings');
      }
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    if (items.some((i) => i.toLowerCase() === newItem.trim().toLowerCase())) {
      setNewItem('');
      return;
    }

    const updatedItems = [...items, newItem.trim()];
    setItems(updatedItems);
    setNewItem('');
    handleSave(updatedItems);
  };

  const handleRemoveItem = (indexToRemove) => {
    const updatedItems = items.filter((_, index) => index !== indexToRemove);
    setItems(updatedItems);
    handleSave(updatedItems);
  };

  // --- CSV Import Logic ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        let workbook;
        if (isCSV) {
          // Read CSV as strict UTF-8 string to prevent character encoding issues like Ã¼ instead of ü
          workbook = XLSX.read(evt.target.result, { type: 'string' });
        } else {
          // Read Excel files as binary array
          const data = new Uint8Array(evt.target.result);
          workbook = XLSX.read(data, { type: 'array' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse into json array of objects
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length > 0) {
          const cols = Object.keys(json[0]);
          setImportedData(json);
          setAvailableColumns(cols);

          // Try to guess the best column
          const guess =
            cols.find((c) => /title|name|product|artikel|item|titel/i.test(c)) || cols[0];
          setSelectedColumn(guess);
          extractItems(json, guess);
        } else {
          toastWarning('The uploaded file appears to be empty.');
        }
      } catch (err) {
        console.error(err);
        toastError('Failed to parse the file. Please ensure it is a valid CSV or Excel file.');
      }
    };

    if (isCSV) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }

    // Reset file input so same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractItems = (data, column) => {
    if (!data || !column) return;

    // Create an object to store the first instance of each item to grab its ID/link/desc if they exist
    const itemsMap = new Map();

    data.forEach((row) => {
      const val = row[column];
      if (val && typeof val === 'string' && val.trim().length > 0) {
        const itemStr = val.trim();
        // If we haven't seen this item name yet, save it along with the rest of its row data
        if (!itemsMap.has(itemStr)) {
          // Find matching keys without hardcoding specific languages
          const normalizedKeys = Object.keys(row).map((k) => ({
            original: k,
            lower: k.toLowerCase(),
          }));

          const getId = () => {
            const key = normalizedKeys.find(
              (k) =>
                k.lower === 'id' ||
                k.lower.includes('id') ||
                k.lower.includes('sku') ||
                k.lower.includes('artikelnummer') ||
                k.lower.includes('nummer'),
            );
            return key ? row[key.original] : '';
          };

          const getLink = () => {
            const key = normalizedKeys.find(
              (k) =>
                k.lower === 'link' ||
                k.lower === 'url' ||
                k.lower.includes('link') ||
                k.lower.includes('url') ||
                k.lower.includes('website'),
            );
            return key ? row[key.original] : '';
          };

          const getDesc = () => {
            const key = normalizedKeys.find(
              (k) =>
                k.lower === 'description' ||
                k.lower === 'desc' ||
                k.lower.includes('description') ||
                k.lower.includes('omschrijving') ||
                k.lower.includes('detail'),
            );
            return key ? row[key.original] : '';
          };

          itemsMap.set(itemStr, {
            name: itemStr,
            id: getId(),
            description: getDesc(),
            link: getLink(),
          });
        }
      }
    });

    // Get unique sorted items objects instead of just strings
    const unique = Array.from(itemsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    setExtractedItems(unique);
  };

  const handleColumnChange = (e) => {
    const col = e.target.value;
    setSelectedColumn(col);
    extractItems(importedData, col);
    setSelectedRows([]);
  };

  const toggleImportedItem = (itemName) => {
    const isIgnored = items.some((i) => i.toLowerCase() === itemName.toLowerCase());
    let updatedItems;

    if (isIgnored) {
      updatedItems = items.filter((i) => i.toLowerCase() !== itemName.toLowerCase());
    } else {
      updatedItems = [...items, itemName];
    }

    setItems(updatedItems);
    handleSave(updatedItems);
  };

  const addAllExtracted = () => {
    // Add all extracted item NAMES that aren't already allowed
    const newAdditions = extractedItems
      .map((ext) => ext.name)
      .filter((name) => !items.some((i) => i.toLowerCase() === name.toLowerCase()));

    if (newAdditions.length > 0) {
      const updatedItems = [...items, ...newAdditions];
      setItems(updatedItems);
      handleSave(updatedItems);
    }
  };

  const removeAllExtracted = () => {
    // Remove all extracted item NAMES from the allowed list
    const updatedItems = items.filter(
      (i) => !extractedItems.some((ext) => ext.name.toLowerCase() === i.toLowerCase()),
    );
    setItems(updatedItems);
    handleSave(updatedItems);
  };

  const toggleRowSelection = (itemName) => {
    setSelectedRows((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    );
  };

  const selectAllRows = () => {
    if (selectedRows.length === extractedItems.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(extractedItems.map((item) => item.name));
    }
  };

  const importSelectedRows = () => {
    if (selectedRows.length === 0) return;

    // Add selected items to the allowed list if they are not already there
    const newAdditions = selectedRows.filter(
      (selectedName) => !items.some((i) => i.toLowerCase() === selectedName.toLowerCase()),
    );

    if (newAdditions.length > 0) {
      const updatedItems = [...items, ...newAdditions];
      setItems(updatedItems);
      handleSave(updatedItems);
    }

    // Clear selection after importing
    setSelectedRows([]);
  };

  const clearImport = () => {
    setImportedData(null);
    setAvailableColumns([]);
    setSelectedColumn('');
    setExtractedItems([]);
    setSelectedRows([]);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h2 className="text-xl font-bold text-gray-900">Invoice Import Filters</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg shrink-0 w-max">
            <Icon path={mdiDomain} size={0.6} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Organization Setting
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Define items that should be *included* during PDF invoice sync. If an invoice line item
          matches an item in this list, it will be synced. All others are ignored.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiCheckCircle} size={1} className="text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Settings saved</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
          <Icon path={mdiAlertCircle} size={1} className="text-red-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Save Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Master Ignored List */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full border-t-4 border-gray-600">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span>Currently Allowed List</span>
            <span className="bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
              {items.length} items
            </span>
          </h3>

          <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add manual item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="input-base flex-grow"
              disabled={saving}
            />
            <button
              type="submit"
              disabled={saving || !newItem.trim()}
              className="btn-primary whitespace-nowrap"
            >
              <Icon path={mdiPlus} size={0.8} /> Add
            </button>
          </form>

          <div className="flex-grow overflow-y-auto max-h-[500px] border border-gray-200 rounded-lg p-3 bg-gray-50">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-8">No items allowed yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...items]
                  .sort((a, b) => a.localeCompare(b))
                  .map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded p-2 text-sm shadow-sm group"
                    >
                      <span className="text-gray-800 truncate" title={item}>
                        {item}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(items.indexOf(item))}
                        disabled={saving}
                        className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        <Icon path={mdiClose} size={0.7} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Col: Webshop Import Area */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full border-t-4 border-orange-500">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Import Webshop List</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload an Excel or CSV export from your webshop. Select which items should be included.
          </p>

          {!importedData ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center mt-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon path={mdiUpload} size={2} className="text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Click to select files</p>
              <p className="text-xs text-gray-500 mb-4">Supported formats: .csv, .xlsx, .xls</p>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  e.stopPropagation(); // prevent double clicking
                  handleFileUpload(e);
                }}
              />
              <button type="button" className="btn-outline pointer-events-none">
                Browse Files
              </button>
            </div>
          ) : (
            <div className="flex flex-col flex-grow">
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-orange-800 flex items-center gap-1">
                    <Icon path={mdiTableColumn} size={0.7} /> Select Name Column:
                  </label>
                  <button
                    onClick={clearImport}
                    className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Cancel Import
                  </button>
                </div>
                <select
                  className="input-base w-full text-sm py-1.5 px-3 h-auto"
                  value={selectedColumn}
                  onChange={handleColumnChange}
                >
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Found {extractedItems.length} items
                </span>
                <div className="flex gap-2 items-center">
                  {selectedRows.length > 0 && (
                    <button
                      onClick={importSelectedRows}
                      className="text-xs bg-orange-600 text-white hover:bg-orange-700 px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                      disabled={saving}
                    >
                      Add {selectedRows.length} to Allowed List
                    </button>
                  )}
                  <div className="flex px-2 border-l border-gray-200 ml-2">
                    <button
                      onClick={addAllExtracted}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      disabled={saving}
                    >
                      Allow All
                    </button>
                    <span className="text-gray-300 mx-2">|</span>
                    <button
                      onClick={removeAllExtracted}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                      disabled={saving}
                    >
                      Remove All
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg p-0 table-fixed relative">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10 w-full shadow-sm">
                    <tr>
                      <th className="px-4 py-2 w-10 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          checked={
                            extractedItems.length > 0 &&
                            selectedRows.length === extractedItems.length
                          }
                          onChange={selectAllRows}
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {extractedItems.map((item, idx) => {
                      const isIgnored = items.some(
                        (i) => i.toLowerCase() === item.name.toLowerCase(),
                      );
                      const isSelected = selectedRows.includes(item.name);
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50 transition-colors ${isIgnored ? 'bg-red-50/10' : isSelected ? 'bg-orange-50/30' : 'bg-white'}`}
                        >
                          <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                            <input
                              type="checkbox"
                              className={`rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer ${isIgnored ? 'opacity-50 cursor-not-allowed' : ''}`}
                              checked={isSelected}
                              disabled={isIgnored}
                              onChange={() => toggleRowSelection(item.name)}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {item.id || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-semibold truncate max-w-[200px] block ${isIgnored ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                              title={item.name}
                            >
                              {item.name || '-'}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-xs text-gray-500 truncate max-w-[250px]"
                            title={item.description || ''}
                          >
                            {item.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-blue-500 whitespace-nowrap">
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-700 hover:underline"
                              >
                                View Link
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap align-middle">
                            <button
                              onClick={() => toggleImportedItem(item.name)}
                              disabled={saving}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all w-32
                                ${
                                  isIgnored
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-gray-300'
                                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200 border border-red-200 shadow-sm'
                                }`}
                            >
                              {isIgnored ? (
                                <>
                                  <Icon path={mdiCheck} size={0.5} /> Allowed
                                </>
                              ) : (
                                <>
                                  <Icon path={mdiPlus} size={0.5} /> Add to Allowed
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
