# Step 5: Testing Logo Upload - Detailed Guide

## Prerequisites Before Testing

Before you can test, you MUST complete these steps in Supabase:

### ✅ Checklist - Have you done these?
- [ ] Created 'logos' bucket in Supabase Dashboard
- [ ] Set bucket to PUBLIC
- [ ] Added RLS policies (see Step 3 in checklist)
- [ ] You are logged in as an admin user

**If you haven't done these, the test will fail!** Go back to Steps 1-3 first.

---

## Step-by-Step Testing Instructions

### 1. Navigate to the Test Page

**Option A: Direct URL**
1. Open your browser
2. Navigate to: `http://localhost:5173/Map/#/storage-test`
   (or if using dev server: `http://localhost:5173/#/storage-test`)

**Option B: From Admin Dashboard**
1. Log in to admin dashboard: `/Map/#/admin`
2. Manually type in URL bar: `/Map/#/storage-test`

---

### 2. Check Authentication Status

You should see a section labeled **"Authentication Status"**

✅ **Success looks like:**
```
✅ Authenticated as: your-email@example.com
```

❌ **Failure looks like:**
```
❌ Not authenticated - Please log in first
```

**If failed:**
1. Go to `/Map/#/admin`
2. Log in with your admin credentials
3. Return to `/Map/#/storage-test`

---

### 3. Check Bucket Status

You should see a section labeled **"Storage Bucket Status"**

✅ **Success looks like:**
```
✅ Bucket 'logos' exists and is accessible
```

❌ **Failure looks like:**
```
❌ Bucket 'logos' not found or inaccessible
Error: Storage bucket "logos" not found. Please create it in Supabase Dashboard.
```

**If failed:**
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (the one with your map data)
3. **Click "Storage"** in left sidebar
4. **Click "New bucket"** button
5. **Configure:**
   - Name: `logos` (exactly, lowercase)
   - Public bucket: ✅ CHECK THIS BOX
   - File size limit: `5242880`
6. **Click "Create bucket"**
7. **Go to SQL Editor** in Supabase
8. **Run these policies** (copy from Step 3 in main checklist):
   ```sql
   CREATE POLICY "Public can view logos"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'logos');

   CREATE POLICY "Authenticated users can upload logos"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'logos' 
     AND auth.role() = 'authenticated'
   );

   CREATE POLICY "Authenticated users can delete logos"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'logos' 
     AND auth.role() = 'authenticated'
   );
   ```
9. **Return to test page** and click "Recheck" button

---

### 4. Upload a Test Image

Once both status checks show ✅:

1. **Prepare a test image:**
   - Use any PNG, JPG, WEBP, AVIF, or SVG
   - Keep it under 5MB
   - Sample images: your company logo, a test icon, etc.

2. **Click "Upload Test Image" button**
   - File picker will open
   - Select your image
   - Wait for upload (usually 1-3 seconds)

3. **Watch for status:**
   - During upload: "Uploading..." (gray button, spinning icon)
   - Success: Green checkmark + "Upload successful!"
   - Error: Red alert icon + error message

---

### 5. Verify Image Displays

✅ **Success looks like:**
- Small preview image appears below upload button
- Image is clear and properly displayed
- Delete button (trash icon) appears next to image

❌ **Common issues:**
- Image URL shown but no image: Bucket might not be public
- Broken image icon: Check file was actually uploaded
- No preview: Check browser console for errors

**To verify in Supabase:**
1. Go to Supabase Dashboard → Storage → logos bucket
2. Click on "test" folder
3. You should see your uploaded file with a timestamp name
4. Click the file to preview it

---

### 6. Test Delete (Optional)

1. **Click the trash/delete icon** next to the uploaded image
2. **Image should disappear** from preview
3. **Check Upload History section** - record should remain but image gone

**To verify deletion:**
- Go back to Supabase Dashboard → Storage → logos → test
- File should be removed

---

### 7. Check Upload History

Below the upload section, you should see **"Upload History"**

Each upload shows:
- ✓ Success indicator (green)
- Timestamp of upload
- Full URL to the image
- Storage path (e.g., `test/1699635420123_a7f3d2.png`)
- Thumbnail preview of the image

This helps you verify:
- URLs are properly formatted
- Images are accessible
- Multiple uploads work correctly

---

## Expected Results Summary

### All Green ✅
If everything works, you should see:
1. ✅ Authentication status: Logged in
2. ✅ Bucket status: Exists and accessible
3. ✅ Upload works: Image appears
4. ✅ Display works: Preview shows correctly
5. ✅ Delete works: Image can be removed
6. ✅ History tracked: All uploads logged

### Next Step After Success
Once all tests pass:
- Proceed to **Phase 3**: Integrate into BrandingSettings
- Proceed to **Phase 4**: Integrate into CompaniesTab

---

## Troubleshooting Common Issues

### Issue 1: "Not authenticated"
**Cause**: Not logged in or session expired
**Fix**: 
1. Navigate to `/Map/#/admin`
2. Log in with admin email/password
3. Return to storage test page

### Issue 2: "Bucket not found"
**Cause**: Bucket doesn't exist or wrong name
**Fix**: 
1. Check Supabase Dashboard → Storage
2. Verify bucket named exactly `logos` exists
3. If not, create it following Step 3 instructions above

### Issue 3: "Permission denied" on upload
**Cause**: RLS policies not set up
**Fix**: 
1. Go to Supabase Dashboard → SQL Editor
2. Run the three policy creation queries from Step 3
3. Verify in Storage → Policies tab

### Issue 4: Upload succeeds but image doesn't display
**Cause**: Bucket not public
**Fix**: 
1. Go to Supabase Dashboard → Storage
2. Click on 'logos' bucket
3. Go to Settings
4. Ensure "Public bucket" is CHECKED
5. Save settings

### Issue 5: "File type not allowed"
**Cause**: Unsupported file format
**Fix**: 
- Only use: PNG, JPG, JPEG, WEBP, AVIF, or SVG
- Check file extension is correct

### Issue 6: "File too large"
**Cause**: File over 5MB
**Fix**: 
- Resize/compress your image
- Use online tools like TinyPNG or Squoosh

### Issue 7: Console shows CORS errors
**Cause**: Supabase CORS not configured (rare)
**Fix**: 
- Usually auto-configured by Supabase
- Check your VITE_SUPABASE_URL in .env matches dashboard
- Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

---

## Browser Console Debugging

If issues persist, open browser console (F12) and look for:

**Good signs:**
```
✓ Bucket check successful
✓ File validated
✓ Upload complete: https://...
```

**Bad signs (with fixes):**
```
❌ "Storage bucket not found" → Create bucket
❌ "new row violates row-level security" → Add RLS policies
❌ "Failed to fetch" → Check Supabase URL/key in .env
❌ "Invalid file type" → Use PNG/JPG/WEBP/AVIF/SVG only
```

---

## Quick Debug Commands

Open browser console on test page and run:

```javascript
// Check if authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Check bucket
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// Try listing files
const { data: files } = await supabase.storage.from('logos').list('test');
console.log('Files:', files);
```

---

## Still Stuck?

1. **Check the main checklist**: LOGO_UPLOAD_CHECKLIST.md
2. **Read setup guide**: SUPABASE_STORAGE_SETUP.md
3. **Review architecture**: LOGO_UPLOAD_ARCHITECTURE.md
4. **Check Supabase logs**: Dashboard → Logs → Storage

## Video Walkthrough (If Needed)

I can guide you through this live if needed. The key steps are:
1. Supabase bucket exists and is public ← MOST COMMON ISSUE
2. RLS policies applied ← SECOND MOST COMMON
3. You're logged in as admin
4. File meets requirements (type, size)

Once those 4 are done, it should work perfectly! 🎉
