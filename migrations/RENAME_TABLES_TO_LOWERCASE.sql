-- ============================================
-- Rename tables from CamelCase to lowercase
-- Run this ONCE in your Supabase SQL editor
-- ============================================

-- Rename Companies to companies
ALTER TABLE IF EXISTS public."Companies" RENAME TO companies;

-- Rename Assignments to assignments
ALTER TABLE IF EXISTS public."Assignments" RENAME TO assignments;

-- Rename Assignments_Archive to assignments_archive
ALTER TABLE IF EXISTS public."Assignments_Archive" RENAME TO assignments_archive;

-- Verify the rename worked
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND (tablename = 'companies' OR tablename = 'assignments' OR tablename = 'assignments_archive')
ORDER BY tablename;
