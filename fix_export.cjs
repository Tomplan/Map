const fs = require('fs');

let content = fs.readFileSync('src/components/common/ExportButton.jsx', 'utf8');

// Replace imports to add mdiClose if not there
if (!content.includes('mdiClose')) {
    content = content.replace('mdiChevronDown } from \'@mdi/js\';', 'mdiChevronDown, mdiClose } from \'@mdi/js\';');
}

// Add state for column selection
content = content.replace(
  'const [isExporting, setIsExporting] = useState(false);',
  `const [isExporting, setIsExporting] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [exportFormat, setExportFormat] = useState(null);
  const [preparedData, setPreparedData] = useState([]);
  const [exportMetadata, setExportMetadata] = useState({});`
);

// We need to rewrite handleExport completely
const handleExportMatch = content.match(/const handleExport = async \(format\) => \{[\s\S]*?(?=\n  return \()/);
if (!handleExportMatch) {
    console.error("Could not find handleExport!");
    process.exit(1);
}

const newLogic = `
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

      let columnsToUse = config.exportColumns.slice();
      const supabaseClient = additionalData?.supabase || globalSupabase;
      let categories = null;
      
      if (config.table === 'companies' && supabaseClient) {
        try {
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
            categories = inMemoryCategories.map((c) => ({
              slug: c.slug,
              category_translations: c.translations || [],
            }));
          }

          if (Array.isArray(categories) && categories.length > 0) {
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
            const placeholderIndex = columnsToUse.findIndex(
              (c) => c.key === 'categories' || c.header === 'Categories',
            );

            const categoryCols = categories.map((cat) => {
              const header =
                cat.category_translations?.find((t) => t.language === 'nl')?.name ||
                cat.category_translations?.[0]?.name ||
                cat.slug;
              return { key: \`category:\${cat.slug}\`, header, type: 'boolean' };
            });

            if (placeholderIndex >= 0) {
              columnsToUse.splice(placeholderIndex, 1);
            }
            columnsToUse.push(...categoryCols);

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

            exportData = exportData.map((row) => {
              const id = row.id;
              const slugs = categoryMap[id] || [];
              const newRow = { ...row };
              categories.forEach((cat) => {
                newRow[\`category:\${cat.slug}\`] = slugs.includes(cat.slug) ? '+' : '-';
              });
              return newRow;
            });
          }
        } catch (e) {
          console.error('Error expanding company categories for export:', e);
        }
      }

      const categorySource =
        Array.isArray(categories) && categories.length > 0
          ? additionalData?.supabase
            ? 'supabase'
            : inMemoryCategories && inMemoryCategories.length
              ? 'in-memory'
              : 'unknown'
          : 'none';
      const categorySlugs = Array.isArray(categories) ? categories.map((c) => c.slug) : [];

      setExportMetadata({
        category_source: categorySource,
        category_slugs: categorySlugs,
        format: 'wide',
      });

      // Prepare UI state for column selection
      const selectableColumns = columnsToUse.map(col => ({
        ...col,
        selected: true // By default all are selected
      }));
      
      setAvailableColumns(selectableColumns);
      setPreparedData(exportData);
      setExportFormat(format);
      setIsColumnModalOpen(true);
      setIsExporting(false); // Stop loading indicator while waiting for user

    } catch (error) {
      setIsExporting(false);
      console.error('Error preparing export:', error);
      toastError('Failed to prepare export data');
      if (onExportError) onExportError(error);
    }
  };

  const executeExport = async () => {
    setIsColumnModalOpen(false);
    setIsExporting(true);

    try {
      const selectedColumns = availableColumns.filter(c => c.selected);
      if (selectedColumns.length === 0) {
        toastError('No columns selected for export');
        setIsExporting(false);
        return;
      }

      const baseFilename = getFilename();
      let result;

      switch (exportFormat) {
        case 'excel':
          result = await exportToExcel(preparedData, selectedColumns, baseFilename, {
            metadata: exportMetadata,
            // Only freeze if we have at least 2 columns selected
            freezeColumns: Math.min(2, selectedColumns.length),
          });
          break;
        case 'csv':
          result = await exportToCSV(preparedData, selectedColumns, baseFilename);
          break;
        case 'json':
          // JSON generally pushes everything, but we can filter properties based on selectedColumns
          const filteredJsonData = preparedData.map(row => {
            const filteredRow = {};
            selectedColumns.forEach(col => {
              filteredRow[col.key] = row[col.key];
            });
            return filteredRow;
          });
          result = await exportToJSON(filteredJsonData, baseFilename);
          break;
        default:
          throw new Error(\`Unsupported export format: \${exportFormat}\`);
      }

      if (result) {
        toastSuccess(\`Successfully exported \${data.length} records\`);
        if (onExportComplete) onExportComplete(result);
      }
    } catch (error) {
      console.error('Error executing export:', error);
      toastError('Export failed');
      if (onExportError) onExportError(error);
    } finally {
      setIsExporting(false);
      setPreparedData([]); // Clear memory
    }
  };

  const toggleAllColumns = (selected) => {
    setAvailableColumns(availableColumns.map(col => ({ ...col, selected })));
  };

  const toggleColumn = (index, selected) => {
    const updated = [...availableColumns];
    updated[index].selected = selected;
    setAvailableColumns(updated);
  };
`;

content = content.replace(handleExportMatch[0], newLogic);

// Add the modal UI to the return statement
const returnMatch = content.match(/return \([\s\S]*?(?=;\n\})/);
if (!returnMatch) {
    console.error("Could not find return statement");
    process.exit(1);
}

const modalUI = `
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] flex flex-col m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Select Columns to Export</h3>
              <button 
                onClick={() => setIsColumnModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </div>
            
            <div className="p-4 border-b flex justify-between bg-gray-50">
              <button 
                onClick={() => toggleAllColumns(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <button 
                onClick={() => toggleAllColumns(false)}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Deselect All
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-2">
                {availableColumns.map((col, idx) => (
                  <label 
                    key={col.key || idx} 
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                  >
                    <input 
                      type="checkbox"
                      checked={col.selected}
                      onChange={(e) => toggleColumn(idx, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 select-none flex-1 truncate" title={col.header}>
                      {col.header}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button 
                onClick={() => setIsColumnModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeExport} 
                disabled={!availableColumns.some(c => c.selected)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-sm"
              >
                <Icon path={mdiDownload} size={0.7} className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      )}
`;

const updatedReturn = returnMatch[0].replace('    </div>\n  )', `    </div>\n${modalUI}\n  )`);

content = content.replace(returnMatch[0], updatedReturn);

fs.writeFileSync('src/components/common/ExportButton.jsx', content, 'utf8');
console.log("Updated ExportButton.jsx");

