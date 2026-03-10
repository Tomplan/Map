const fs = require('fs');
let content = fs.readFileSync('src/components/admin/InvoiceSyncTab.jsx', 'utf8');

// 1. Add definitions
content = content.replace(
  '  const [uploading, setUploading] = useState(false);',
  '  const [uploading, setUploading] = useState(false);\n  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });\n  const [isActionsOpen, setIsActionsOpen] = useState(false);'
);

// 2. Change variables in handledFileUpload
content = content.replace(
  '    setUploading(true);\n    let successCount = 0;',
  '    setUploading(true);\n    setUploadProgress({ current: 0, total: files.length });\n    setIsActionsOpen(false);\n    let successCount = 0;'
);

// 3. Change loop to let i = 0 for progress
content = content.replace(
  '    try {\n      for (const file of files) {\n        try {',
  '    try {\n      for (let i = 0; i < files.length; i++) {\n        const file = files[i];\n        try {'
);

// 4. Update progress end loop
content = content.replace(
  '          errorCount++;\n        }\n      }\n\n      // Show summary',
  '          errorCount++;\n        }\n        setUploadProgress({ current: i + 1, total: files.length });\n      }\n\n      // Show summary'
);

// 5. Update complete function and reset
content = content.replace(
  '    } finally {\n      setUploading(false);\n      if (fileInputRef.current) {',
  '    } finally {\n      setUploading(false);\n      setUploadProgress({ current: 0, total: 0 });\n      if (fileInputRef.current) {'
);

// 6. Rewrite dropdown Actions and add progress block
const oldMarkup1 = `        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon path={mdiUpload} size={0.8} />
            {uploading ? 'Uploading...' : 'Upload PDF(s)'}
          </button>

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon path={mdiRefresh} size={0.8} />
            Refresh
          </button>
        </div>
      </div>

      {error && (`

const newMarkup1 = `        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon path={mdiRefresh} size={0.8} />
            Refresh
          </button>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
              title={t('common.actionsMenu', 'Actions')}
            >
              <span>{t('common.actions', 'Actions')}</span>
              <Icon path={isActionsOpen ? mdiChevronUp : mdiChevronDown} size={0.7} />
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Data Tools
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-transparent disabled:opacity-50 cursor-pointer"
                >
                  <Icon path={mdiUpload} size={0.8} />
                  {uploading ? 'Importing...' : 'Import PDF(s)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploading && uploadProgress.total > 0 && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-sm font-medium text-gray-700 relative z-10">
            <span>Importing PDFs ({Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)</span>
            <span>{uploadProgress.current} / {uploadProgress.total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 relative z-10 shadow-inner overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 flex items-center justify-end pr-1"
              style={{ width: \`\${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%\` }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 shadow"></div>
            </div>
          </div>
        </div>
      )}

      {error && (`

content = content.replace(oldMarkup1, newMarkup1);

// 7. Rewrite empty state button
const oldEmpty = `          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Icon path={mdiUpload} size={1} />
            {uploading ? 'Uploading...' : 'Upload PDF(s)'}
          </button>`;

const newEmpty = `          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon path={mdiUpload} size={1} />
            {uploading ? 'Importing...' : 'Import PDF(s)'}
          </button>`;

content = content.replace(oldEmpty, newEmpty);

fs.writeFileSync('src/components/admin/InvoiceSyncTab.jsx', content);
console.log('Successfully patched InvoiceSyncTab.jsx!');
