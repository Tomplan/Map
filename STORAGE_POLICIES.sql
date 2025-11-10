-- ============================================
-- Supabase Storage Policies for 'logos' Bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- IMPORTANT: First, check if policies already exist
-- If you see errors like "policy already exists", that's OK - skip to the bottom

-- ============================================
-- Step 1: Drop existing policies (if any)
-- ============================================
-- Run these if policies exist but aren't working:

DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- ============================================
-- Step 2: Create policies for storage.objects
-- ============================================

-- Policy 1: Allow public to view/download logos
CREATE POLICY "Public can view logos"
ON storage.objects 
FOR SELECT
USING (bucket_id = 'logos');

-- Policy 2: Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects 
FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects 
FOR DELETE
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- Step 3: Verify policies were created
-- ============================================
-- Run this query to check:

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%logos%';

-- You should see 3 policies listed

-- ============================================
-- Alternative: If above doesn't work, try this
-- ============================================
-- Some Supabase instances need this format:

-- DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- CREATE POLICY "Allow public read"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'logos');

-- CREATE POLICY "Allow authenticated upload"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'logos');

-- CREATE POLICY "Allow authenticated delete"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'logos');
