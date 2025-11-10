# Supabase Storage Setup for Logo Uploads

## Overview

This guide explains how to set up Supabase Storage to enable logo uploads for companies and branding in the Event Map app.

## Prerequisites

- Supabase project already set up
- Admin access to Supabase Dashboard
- Authentication enabled (already configured)

## Setup Steps

### 1. Create the Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `logos`
   - **Public bucket**: ✅ Enable (logos need to be publicly accessible)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: 
     ```
     image/png
     image/jpeg
     image/jpg
     image/webp
     image/avif
     image/svg+xml
     ```
6. Click **"Create bucket"**

### 2. Configure Storage Policies

The bucket should be public for reading but restricted for writing. Set up these policies:

#### Policy 1: Public Read Access
```sql
-- Allow anyone to read logos
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');
```

#### Policy 2: Authenticated Upload Access
```sql
-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Authenticated Delete Access (Optional)
```sql
-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);
```

### 3. Apply Policies via SQL Editor

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste and run each policy above
4. Verify policies are active in **Storage > Policies**

### 4. Test the Setup

You can test the storage setup in the admin dashboard:

1. Log in to the admin dashboard
2. Go to **Companies** tab
3. Try uploading a logo for a company
4. Verify the logo appears correctly

## Storage Structure

Logos will be organized in folders:

```
logos/
├── companies/
│   ├── 1234567890_abc123.png
│   ├── 1234567891_def456.jpg
│   └── ...
└── events/
    ├── 1234567892_ghi789.avif
    └── ...
```

## File Naming Convention

Files are automatically renamed on upload:
- Format: `{timestamp}_{random}.{extension}`
- Example: `1699635420123_a7f3d2.png`
- This prevents naming conflicts and ensures uniqueness

## Usage in Code

### Upload a Logo
```javascript
import { uploadLogo } from '../services/logoUploadService';

const result = await uploadLogo(file, 'companies');
if (result.error) {
  console.error(result.error);
} else {
  console.log('Uploaded:', result.url);
  // Save result.url to database
}
```

### Use LogoUploader Component
```jsx
import LogoUploader from '../components/LogoUploader';

<LogoUploader
  currentLogo={company.logo}
  onUploadComplete={(url, path) => {
    // Update company logo in database
    updateCompany(company.id, { logo: url });
  }}
  folder="companies"
  showPreview={true}
/>
```

## Troubleshooting

### Error: "Storage bucket not found"
- Ensure you created the bucket named exactly `logos`
- Check bucket is set to public
- Verify you're connected to the correct Supabase project

### Error: "Permission denied"
- Check RLS policies are correctly configured
- Verify user is authenticated before uploading
- Check bucket permissions in Storage settings

### Error: "File type not allowed"
- Ensure file is one of: PNG, JPG, WEBP, AVIF, SVG
- Check file MIME type matches allowed types
- Verify file isn't corrupted

### Uploads work but images don't display
- Verify bucket is set to **public**
- Check the URL format in your database
- Ensure CORS is properly configured (usually automatic)

## Migration from Local Logos

If you have existing logos in `public/assets/logos/`:

1. Keep them for backward compatibility
2. New uploads will go to Supabase Storage
3. The app handles both local and Supabase URLs via `getLogoPath()`
4. Optionally migrate old logos using the admin dashboard

## Security Considerations

✅ **Implemented:**
- File type validation
- File size limits (5MB)
- Authenticated uploads only
- Public read access for display

⚠️ **Consider adding:**
- Image dimension validation
- Virus scanning for uploaded files
- Rate limiting on uploads
- Automatic image optimization/resizing

## Cost Considerations

Supabase Storage pricing (as of 2024):
- **Free tier**: 1GB storage, 2GB bandwidth/month
- **Pro tier**: 100GB storage, 200GB bandwidth/month
- Overage: $0.021/GB storage, $0.09/GB bandwidth

For a typical event with 100-200 companies:
- Average logo size: 50KB
- Total storage: ~10MB
- Well within free tier limits

## Next Steps

After completing this setup:

1. ✅ Bucket created and configured
2. ✅ Policies applied
3. ✅ Test upload in admin dashboard
4. ✅ Update CompaniesTab to use LogoUploader
5. ✅ Update BrandingSettings to use LogoUploader
6. Consider adding bulk upload/migration tools
