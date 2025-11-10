# Logo Upload Quick Start Checklist

## ✅ Phase 1: Supabase Setup (15 minutes)

### Step 1: Create Storage Bucket
- [ ] Go to Supabase Dashboard → Storage
- [ ] Click "New bucket"
- [ ] Name: `logos`
- [ ] Public bucket: ✅ Enable
- [ ] File size limit: `5242880` (5MB)
- [ ] Click "Create bucket"

### Step 2: Configure Bucket Settings
- [ ] Click on 'logos' bucket
- [ ] Go to Settings tab
- [ ] Allowed MIME types: Add these types:
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `image/webp`
  - `image/avif`
  - `image/svg+xml`

### Step 3: Set Up RLS Policies
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run this query:

```sql
-- Policy 1: Public Read
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Policy 2: Authenticated Upload
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Authenticated Delete
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);
```

- [ ] Verify policies in Storage → Policies tab

---

## ✅ Phase 2: Test Setup (5 minutes)

### Step 4: Add Test Route (Optional)
- [ ] Open `src/components/AppRoutes.jsx`
- [ ] Add import:
```jsx
import StorageTestPage from './StorageTestPage';
```
- [ ] Add route (inside admin-protected routes):
```jsx
<Route path="/storage-test" element={<StorageTestPage />} />
```

### Step 5: Test Upload
- [ ] Log in to admin dashboard at `http://localhost:5173/Map/admin`
  - Enter your admin email and password
  - Wait for successful login (you'll see the admin dashboard)
- [ ] Navigate to `/Map/storage-test` (change URL in browser)
  - Full URL: `http://localhost:5173/Map/storage-test`
- [ ] Verify on the test page:
  - [ ] Authentication status shows ✅ (if ❌, go back to step 1)
  - [ ] Bucket status shows ✅ (if ❌, complete Steps 1-3 first)
  - [ ] Upload a test image
  - [ ] Image displays correctly
  - [ ] Delete works (optional)

---

## ✅ Phase 3: Integrate into BrandingSettings (10 minutes)

### Step 6: Update BrandingSettings Component
- [ ] Open `src/components/BrandingSettings.jsx`
- [ ] Add import at top:
```jsx
import LogoUploader from './LogoUploader';
```

- [ ] Find the logo text input (around line 89)
- [ ] Replace with:
```jsx
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
  <LogoUploader
    currentLogo={logo}
    onUploadComplete={(url, path) => {
      setLogo(url);
      onChange({ id: 1, logo: url, themeColor, fontFamily, eventName });
    }}
    folder="events"
    label="Upload Event Logo"
    showPreview={false}
    allowDelete={true}
    onDelete={() => {
      const defaultLogo = BRANDING_CONFIG.getDefaultLogoPath();
      setLogo(defaultLogo);
      onChange({ id: 1, logo: defaultLogo, themeColor, fontFamily, eventName });
    }}
  />
  {/* Keep text input as fallback for external URLs */}
  <input
    type="text"
    value={logo}
    onChange={handleLogoChange}
    className="px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    style={{ color: '#2563eb', background: '#f8fafc' }}
    placeholder="Or paste logo URL"
  />
</div>
```

### Step 7: Test BrandingSettings
- [ ] Go to Admin Dashboard → Settings
- [ ] Upload a new event logo
- [ ] Verify logo updates immediately
- [ ] Check database updated correctly
- [ ] Test delete button
- [ ] Test text input fallback

---

## ✅ Phase 4: Integrate into CompaniesTab (15 minutes)

### Step 8: Update CompaniesTab Component
- [ ] Open `src/components/admin/CompaniesTab.jsx`
- [ ] Add import at top:
```jsx
import LogoUploader from '../LogoUploader';
```

### Step 9: Update Create Form
- [ ] Find the "Create new company form" section (around line 108)
- [ ] Replace logo text input with:
```jsx
<div className="col-span-2">
  <label className="block text-sm font-medium mb-1">Company Logo</label>
  <LogoUploader
    currentLogo={newCompanyForm.logo}
    onUploadComplete={(url, path) => {
      setNewCompanyForm({ ...newCompanyForm, logo: url });
    }}
    folder="companies"
    label="Upload Logo"
    showPreview={true}
  />
  <input
    type="text"
    placeholder="Or paste external logo URL"
    value={newCompanyForm.logo}
    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, logo: e.target.value })}
    className="px-3 py-2 border rounded mt-2 w-full text-sm"
  />
</div>
```

### Step 10: Update Edit Mode
- [ ] Find the Logo column in edit mode (around line 210)
- [ ] Replace with:
```jsx
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
```

### Step 11: Test CompaniesTab
- [ ] Go to Admin Dashboard → Companies
- [ ] Create a new company with logo upload
- [ ] Edit existing company and upload logo
- [ ] Test delete functionality
- [ ] Verify logos display correctly in table
- [ ] Test text input fallback

---

## ✅ Phase 5: Production Checklist

### Step 12: Final Verification
- [ ] All uploads appear in Supabase Storage Dashboard
- [ ] Logos display correctly on map
- [ ] Logos display correctly in admin tables
- [ ] BrandingBar shows uploaded event logo
- [ ] Companies tab shows all company logos
- [ ] No console errors during upload
- [ ] Delete functionality works

### Step 13: Clean Up (Optional)
- [ ] Remove test uploads from storage
- [ ] Remove StorageTestPage route (if added)
- [ ] Review and adjust file size limits if needed

### Step 14: Documentation
- [ ] Share SUPABASE_STORAGE_SETUP.md with team
- [ ] Add storage bucket name to environment docs
- [ ] Document backup/migration procedures

---

## 🎉 Success Criteria

You're done when:
- ✅ Admins can upload logos in BrandingSettings
- ✅ Admins can upload logos when creating companies
- ✅ Admins can upload logos when editing companies
- ✅ Logos display correctly throughout the app
- ✅ No errors in browser console
- ✅ Storage bucket visible in Supabase Dashboard

---

## 🆘 Troubleshooting

### Issue: Bucket not found
**Fix**: Verify bucket name is exactly `logos` (lowercase)

### Issue: Permission denied
**Fix**: Check RLS policies are applied, user is authenticated

### Issue: Upload succeeds but image doesn't show
**Fix**: Ensure bucket is set to **public**

### Issue: File type error
**Fix**: Only PNG, JPG, WEBP, AVIF, SVG supported

### Need Help?
1. Check StorageTestPage diagnostics
2. Review SUPABASE_STORAGE_SETUP.md
3. Check browser console for errors
4. Verify Supabase Dashboard → Storage → Policies

---

## 📁 Files Created

All implementation files are ready:
- ✅ `src/services/logoUploadService.js`
- ✅ `src/components/LogoUploader.jsx`
- ✅ `src/components/StorageTestPage.jsx`
- ✅ Documentation files (4 guides)

Just follow the checklist above to integrate!
