migrations/CLEANUP.md
=====================

Purpose
-------
This file documents which migration files are canonical (to run) and which are archived/variants (kept for reference but not for routine execution).

Canonical (authoritative) migrations in `migrations/`
---------------------------------------------------
(These are the numeric-prefixed files you should run in order)
- `00_bootstrap.sql` (wrapper — review before running)
- `01_create_organization_profile.sql`
- `02_rename_organization_profile.sql`
- `03_create_marker_defaults.sql`
- `04_create_companies_and_assignments.sql`
- `05_create_company_translations.sql`
- `06_create_user_roles.sql`
- `07_allow_admins_read_user_roles.sql`
- `08_allow_admins_invite_users.sql`
- `09_create_event_subscriptions.sql`
- `10_add_event_defaults_columns.sql`
- `11_add_branding_columns.sql`
- `12_create_categories_system.sql`
- `13_create_event_activities.sql`
- `14_add_show_location_type_badge.sql`
- `15_seed_event_activities.sql` (seed; run only after companies exist)
- `16_create_feedback_system.sql`
- `17_migrate_data.sql` (data migration from Markers_Content)
- `18_drop_booth_number.sql` (optional; run after migration)
- `19_fix_feedback_update_policy.sql`
- `20_fix_organization_profile_rls.sql`

Archived / Variants in `migrations/variants/`
--------------------------------------------
(Do not run these in production unless you understand the differences.)
- `COMPLETE_MIGRATION.sql`
- `COMPLETE_SETUP.sql`
- `RUN_THIS_FINAL.sql`
- `DATA_MIGRATION_ONLY.sql`
- `RUN_THIS_migrate_data_only.sql`
- `RENAME_TABLES_TO_LOWERCASE.sql`
- `SETUP_RLS_AND_MIGRATE.sql`

Recommended next steps
----------------------
1. Review `migrations/ORDER.md` and confirm the ordering in a staging DB.
2. Keep `migrations/variants/` as an archive; do not run those scripts without a clear rollback plan.
3. When confident, optionally delete variant files from the main branch and preserve them in a backup branch.
4. If you want a single idempotent script for bootstrapping, create `000_full_migration.sql` that carefully includes checks and `CREATE IF NOT EXISTS` forms.

