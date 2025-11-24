Purpose
-------
This directory contains SQL migration scripts used for schema changes, data migrations, RLS (Row Level Security) policies, and seeding for the Map project.

Goal of this document
---------------------
- Provide a canonical run order for the migrations to avoid accidental duplicates or conflicts.
- Mark which SQL files are authoritative and which are variants/legacy.
- Give safety notes and recommended steps before running migrations in staging or production.

Authoritative vs duplicate scripts
---------------------------------
Use the numbered scripts (`000_..`, `001_..`, `002_..`, etc.) as the canonical source of truth. Several files in this folder are composite or variant scripts and should generally NOT be run unless you understand the differences (they are listed as "variants" below):

Authoritative scripts (recommended):
- `02_rename_organization_profile.sql`
- `04_create_companies_and_assignments.sql`
- `17_migrate_data.sql`
- `01_create_organization_profile.sql`
- `18_drop_booth_number.sql`
- `09_create_event_subscriptions.sql`
- `03_create_marker_defaults.sql`
- `10_add_event_defaults_columns.sql`
- `12_create_categories_system.sql`
- `13_create_event_activities.sql`
- `20_fix_organization_profile_rls.sql`
- `15_seed_event_activities.sql`
- `14_add_show_location_type_badge.sql`
- `06_create_user_roles.sql`
- `16_create_feedback_system.sql`
- `11_add_branding_columns.sql`
- `07_allow_admins_read_user_roles.sql`
- `05_create_company_translations.sql`
- `08_allow_admins_invite_users.sql`
- `19_fix_feedback_update_policy.sql`

Variant / composite scripts (run only with care):
- `COMPLETE_MIGRATION.sql`
- `COMPLETE_SETUP.sql`
- `RUN_THIS_FINAL.sql`
- `DATA_MIGRATION_ONLY.sql`
- `RUN_THIS_migrate_data_only.sql`
- `RENAME_TABLES_TO_LOWERCASE.sql`
- `SETUP_RLS_AND_MIGRATE.sql`

Why variants are risky
---------------------
- Many of the variant scripts are near-duplicates of the numbered migrations with small differences (RLS handling, disabling/enabling RLS, case-sensitive table names). Running more than one variant may cause duplicate data insertion or unexpected policy changes.
- Some variants temporarily disable RLS; running them on production without the correct sequencing of helper functions and `user_roles` will leave gaps or errors.

Safety checklist (before running any migrations)
------------------------------------------------
1. Backup your database (full snapshot) and/or export the affected tables.
2. Run migrations first in a staging environment that mirrors production exactly.
3. Ensure `auth.users` and any expected rows (e.g., companies referenced in seeding) exist before running seed scripts like `15_seed_event_activities.sql`.
4. Ensure `06_create_user_roles.sql` runs before any script that references `user_roles` in RLS checks (e.g., `20_fix_organization_profile_rls.sql`, `07_allow_admins_read_user_roles.sql`).
5. Prefer using the per-number migrations in the canonical order (see `ORDER.md`).
6. If you must run a composite script (e.g., `COMPLETE_MIGRATION.sql`), review its content and ensure it isn't duplicating a previously applied migration.

How to use `ORDER.md`
---------------------
`ORDER.md` contains a recommended, safe execution order for the numbered migrations. Follow that list in a staging environment and adjust if you have already applied some migrations.

Recommended follow-up
---------------------
- Consolidate duplicate/variant scripts: keep one idempotent full-run script and one data-only script.
- Rename files to timestamped prefixes (e.g., `20250110-001-create-companies.sql`) if you want a strict linear history.
- Add checks in scripts to make them idempotent (e.g., `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).

Contact / Maintainers
---------------------
If you need assistance running or consolidating migrations, contact the repo owner/maintainers and include the environment (dev/staging/prod) and a DB snapshot ID.
