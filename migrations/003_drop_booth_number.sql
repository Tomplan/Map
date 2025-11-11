-- Migration: Drop booth_number column from assignments tables
-- Reason: Replacing booth_number with glyphText from Markers_Appearance table
-- Date: 2025-01-XX

-- Drop booth_number column from assignments table
ALTER TABLE public.assignments
DROP COLUMN IF EXISTS booth_number;

-- Drop booth_number column from assignments_archive table (if it exists)
ALTER TABLE public.assignments_archive
DROP COLUMN IF EXISTS booth_number;

-- Verification query (run this after migration to confirm)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('assignments', 'assignments_archive')
-- AND column_name = 'booth_number';
-- Expected result: 0 rows (column should not exist)
