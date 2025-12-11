/\*\*

- INTEGRATION EXAMPLES
-
- This file shows how to integrate the LogoUploader component
- into existing components like CompaniesTab and BrandingSettings
  \*/

// ============================================
// Example 1: CompaniesTab Integration
// ============================================

import LogoUploader from '../LogoUploader';

// In the "Create New Company" form section:

<div className="mb-4 p-4 border rounded-lg bg-blue-50">
  <h3 className="font-bold mb-3">New Company</h3>
  <div className="grid grid-cols-2 gap-3">
    <input
      type="text"
      placeholder="Company Name *"
      value={newCompanyForm.name}
      onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
      className="px-3 py-2 border rounded"
    />
    
    {/* Replace the old text input with LogoUploader */}
    <div className="col-span-2">
      <LogoUploader
        currentLogo={newCompanyForm.logo}
        onUploadComplete={(url, path) => {
          setNewCompanyForm({ ...newCompanyForm, logo: url });
        }}
        folder="companies"
        label="Upload Company Logo"
        showPreview={true}
      />
      {/* Optional: Keep text input as fallback for external URLs */}
      <input
        type="text"
        placeholder="Or paste external logo URL"
        value={newCompanyForm.logo}
        onChange={(e) => setNewCompanyForm({ ...newCompanyForm, logo: e.target.value })}
        className="px-3 py-2 border rounded mt-2 w-full text-sm"
      />
    </div>

    <input
      type="text"
      placeholder="Website URL"
      value={newCompanyForm.website}
      onChange={(e) => setNewCompanyForm({ ...newCompanyForm, website: e.target.value })}
      className="px-3 py-2 border rounded"
    />
    <textarea
      placeholder="Info"
      value={newCompanyForm.info}
      onChange={(e) => setNewCompanyForm({ ...newCompanyForm, info: e.target.value })}
      className="px-3 py-2 border rounded"
      rows={2}
    />

  </div>
  {/* ... rest of create form ... */}
</div>

// In the table's edit mode (Logo column):

<td className="py-1 px-3 border-b text-left">
  {isEditing ? (
    <div className="flex flex-col gap-2">
      <LogoUploader
        currentLogo={editForm.logo}
        onUploadComplete={(url, path) => {
          setEditForm({ ...editForm, logo: url });
        }}
        folder="companies"
        label="Upload"
        showPreview={true}
        allowDelete={true}
        onDelete={() => {
          setEditForm({ ...editForm, logo: '' });
        }}
      />
      {/* Optional: Text input fallback */}
      <input
        type="text"
        value={editForm.logo || ''}
        onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
        className="w-full bg-white border rounded px-2 py-1 text-xs"
        placeholder="Or paste URL"
      />
    </div>
  ) : company.logo && company.logo.trim() !== '' ? (
    <img src={getLogoPath(company.logo)} alt={company.name} className="h-8 object-contain" />
  ) : (
    <span className="text-gray-400 text-sm">No logo</span>
  )}
</td>

// ============================================
// Example 2: BrandingSettings Integration
// ============================================

import LogoUploader from './LogoUploader';

// Replace the text input in BrandingSettings:

<div className="flex items-center w-full" style={{ gap: 10 }}>
  {logo && (
    <img
      src={getLogoPath(logo)}
      alt="Logo"
      style={{
        height: 44,
        width: 44,
        objectFit: 'contain',
        borderRadius: 8,
        border: '1px solid #2563eb',
        background: '#fff',
        marginRight: 2,
      }}
    />
  )}
  
  <input
    type="text"
    value={eventName}
    onChange={handleEventNameChange}
    className="px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold flex-grow"
    style={{ color: '#2563eb', background: '#f8fafc', minWidth: 180, maxWidth: 550 }}
    placeholder="Event Name"
  />
  
  {/* Replace text input with LogoUploader */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <LogoUploader
      currentLogo={logo}
      onUploadComplete={(url, path) => {
        setLogo(url);
        onChange({ id: 1, logo: url, themeColor, fontFamily, eventName });
      }}
      folder="events"
      label="Upload Event Logo"
      showPreview={false} // Preview is already shown on the left
      allowDelete={true}
      onDelete={() => {
        const defaultLogo = BRANDING_CONFIG.getDefaultLogoPath();
        setLogo(defaultLogo);
        onChange({ id: 1, logo: defaultLogo, themeColor, fontFamily, eventName });
      }}
    />
    {/* Optional: Keep text input for external URLs */}
    <input
      type="text"
      value={logo}
      onChange={handleLogoChange}
      className="px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      style={{ color: '#2563eb', background: '#f8fafc' }}
      placeholder="Or paste logo URL"
    />
  </div>
</div>

// ============================================
// Example 3: Standalone Usage
// ============================================

// Simple upload button anywhere in your app:
<LogoUploader
onUploadComplete={(url, path) => {
console.log('Logo uploaded:', url);
// Do something with the URL
}}
folder="misc"
label="Upload Image"
showPreview={false}
/>

// ============================================
// Example 4: With State Management
// ============================================

function MyComponent() {
const [logoUrl, setLogoUrl] = useState('');
const [logoPath, setLogoPath] = useState('');

const handleUpload = async (url, path) => {
setLogoUrl(url);
setLogoPath(path);

    // Save to database
    const { error } = await supabase
      .from('MyTable')
      .update({ logo: url })
      .eq('id', myId);

    if (error) {
      console.error('Error saving logo:', error);
    }

};

const handleDelete = async () => {
// Optional: Delete from storage
if (logoPath) {
await deleteLogo(logoPath);
}

    // Clear from database
    await supabase
      .from('MyTable')
      .update({ logo: null })
      .eq('id', myId);

    setLogoUrl('');
    setLogoPath('');

};

return (
<LogoUploader
      currentLogo={logoUrl}
      onUploadComplete={handleUpload}
      onDelete={handleDelete}
      folder="my-folder"
      showPreview={true}
      allowDelete={true}
    />
);
}

// ============================================
// Example 5: Bulk Upload (Future Enhancement)
// ============================================

function BulkLogoUploader({ companies, onComplete }) {
const [uploading, setUploading] = useState(false);
const [progress, setProgress] = useState(0);

const handleBulkUpload = async (files) => {
setUploading(true);
const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadLogo(file, 'companies');
      results.push(result);
      setProgress(((i + 1) / files.length) * 100);
    }

    setUploading(false);
    onComplete(results);

};

return (

<div>
<input
type="file"
multiple
accept="image/\*"
onChange={(e) => handleBulkUpload(Array.from(e.target.files))}
/>
{uploading && (
<div className="mt-2">
<div className="w-full bg-gray-200 rounded-full h-2">
<div
className="bg-blue-600 h-2 rounded-full transition-all"
style={{ width: `${progress}%` }}
/>
</div>
<p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% complete</p>
</div>
)}
</div>
);
}
