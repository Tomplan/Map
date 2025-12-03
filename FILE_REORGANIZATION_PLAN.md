# File Reorganization Plan

## Analysis Summary

The current file structure has several files in the wrong locations that need to be organized properly:

## Files to Move

### SQL Files (Currently in root, should be in migrations/)
- `check_all_rls.sql` → `migrations/010_check_all_rls.sql`
- `create_count_tables.sql` → `migrations/011_create_count_tables.sql`
- `create_count_views.sql` → `migrations/012_create_count_views.sql`

### JavaScript Files (Currently in root, should be in scripts/)
- `run-migration.js` → `scripts/run-migration.js`
- `import-subscriptions-2025.js` → `scripts/import-subscriptions-2025.js`

### Shell Scripts (Currently in root, should be in scripts/)
- `dev-sync.sh` → `scripts/dev-sync.sh`
- `run-import.sh` → `scripts/run-import.sh`

### HTML Test Files (Currently in root, should be in tests/)
- `test_migration.html` → `tests/test_migration.html`

### Excel Files (Should be organized)
- `out_freeze.xlsx` → `tests/data/out_freeze.xlsx`
- `test_exceljs_freeze.xlsx` → `tests/data/test_exceljs_freeze.xlsx`

## New Directory Structure

```
project_root/
├── migrations/          # Database migrations
│   ├── 001_add_event_year_to_event_activities.sql
│   ├── 002_update_event_activities_rls.sql
│   ├── ...
│   ├── 010_check_all_rls.sql              # MOVED from root
│   ├── 011_create_count_tables.sql        # MOVED from root
│   └── 012_create_count_views.sql         # MOVED from root
├── scripts/             # All scripts and automation
│   ├── backup/          # Backup system (already organized)
│   ├── dev-sync.sh      # MOVED from root
│   ├── run-import.sh    # MOVED from root
│   ├── run-migration.js # MOVED from root
│   └── import-subscriptions-2025.js       # MOVED from root
├── tests/               # Test files and test data
│   ├── data/            # Test data files
│   │   ├── out_freeze.xlsx                # MOVED from root
│   │   └── test_exceljs_freeze.xlsx       # MOVED from root
│   └── test_migration.html                # MOVED from root
└── src/                 # Source code (unchanged)
    ├── components/
    ├── hooks/
    ├── utils/
    └── ...
```

## Implementation Steps

1. Create new directories if they don't exist
2. Move all identified files to their correct locations
3. Update file references in documentation and code
4. Update package.json scripts if they reference moved files
5. Update any import statements or references in the code
6. Verify the file structure is clean and organized

## Files That Need Reference Updates

After moving the files, the following may need updates:
- package.json scripts section
- Import statements in JavaScript files
- Documentation references
- npm run commands that reference the moved files