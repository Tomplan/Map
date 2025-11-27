
29. `29_add_marker_base_sizes.sql`
    - Adds per-marker sizing fields to `Markers_Appearance`: `iconBaseSize`, `glyphBaseSize`, and `shadowScale`.
    - Backfills default values for existing default records (-1/-2) and sets sensible defaults for existing markers.
    - Run this migration to enable admin-editable per-marker base sizes used by the map sizing engine.
Canonical run order (recommended)
---------------------------------
Run these scripts in staging first. Run only ONE of the composite/variant scripts (see notes) and prefer the numbered scripts below.

1. `01_create_organization_profile.sql`
   - Creates the singleton `"Organization_Profile"` row and helper trigger/function.
   - Reason: sets up `organization_profile` singleton used by other migrations.

2. `02_rename_organization_profile.sql`
   - Renames `"Organization_Profile"` to `organization_profile` and updates RLS and triggers.
   - Reason: normalize the table name early so later migrations reference the lowercase name.

3. `03_create_marker_defaults.sql`
   - Inserts default marker records (-1 and -2) in `Markers_Core` / `Markers_Appearance`.
   - Reason: marker defaults are independent and safe to create early.

4. `04_create_companies_and_assignments.sql`
   - Creates `Companies`, `Assignments`, `Assignments_Archive`, helper `update_updated_at_column()` and `archive_assignments()` function.
   - Reason: core schema for company data and assignments.

5. `05_create_company_translations.sql`
   - Creates `company_translations` and migrates `Companies.info` to `company_translations` (Dutch default).
   - Reason: ensure translations schema exists before migrating company info.

6. `06_create_user_roles.sql`
   - Creates `user_roles` table (secure store for roles) and migrates from `auth.users` metadata.
   - Reason: many RLS policies reference `user_roles`; create it before those policies.

7. `07_allow_admins_read_user_roles.sql`
   - Adds `public.current_user_role()` and `public.get_user_roles_with_email()` helper functions and expands admin read policies.
   - Reason: required for admin user listing and policies that rely on the helper.

8. `08_allow_admins_invite_users.sql`
   - Relax/adjust `user_roles` INSERT policy to allow invitations by admins.
   - Reason: completes user-invite flow policies.

9. `09_create_event_subscriptions.sql`
   - Adds contact fields to `companies`, creates `event_subscriptions` and archive.
   - Reason: depends on `companies` table.

10. `10_add_event_defaults_columns.sql`
    - Adds default meal counts and `notification_settings` to `organization_profile`.

11. `11_add_branding_columns.sql`
    - Adds branding fields (`theme_color`, `font_family`) to `organization_profile`.

12. `12_create_categories_system.sql`
    - Adds `categories`, `category_translations`, `company_categories`, and seeds initial categories.
    - Reason: categorization of companies should exist before program/activities UI relies on categories.

13. `13_create_event_activities.sql`
    - Creates `event_activities` table (bilingual program content) with RLS and triggers.

14. `14_add_show_location_type_badge.sql`
    - Adds `show_location_type_badge` column to `event_activities`.
    - Note: this file previously shared the `008_` prefix with the user-roles migration; the order above ensures `06_create_user_roles.sql` runs before this step.

15. `15_seed_event_activities.sql`
    - Seed script for `event_activities` using company lookups. Run only after `companies` exists and has expected exhibitor names.

16. `16_create_feedback_system.sql`
    - Adds feedback tables and triggers; independent but useful to have before final verification.

17. `17_migrate_data.sql` (or `DATA_MIGRATION_ONLY.sql`)
    - Migrate company data from `Markers_Content` into `Companies` and create `Assignments` for the event year (2025).
    - Run after the `companies` schema and translations are ready.

18. `18_drop_booth_number.sql`
    - Drop `booth_number` from `assignments` and `assignments_archive` if you have migrated booth data to new places.

19. Optional: `RENAME_TABLES_TO_LOWERCASE.sql`
    - If any legacy CamelCase tables remain (e.g., `Companies`), run this carefully. Verify FK references first.

20. Final verification: run the verification blocks in `COMPLETE_MIGRATION.sql` or `COMPLETE_SETUP.sql` or run targeted checks:
    - Count rows migrated from `Markers_Content`.
    - Spot-check a few `Assignments` joined with `Companies` and `Markers_Core`.

Files you should NOT run automatically (variants)
------------------------------------------------
- `COMPLETE_MIGRATION.sql`, `COMPLETE_SETUP.sql`, `RUN_THIS_FINAL.sql`, `RUN_THIS_migrate_data_only.sql`, `SETUP_RLS_AND_MIGRATE.sql`
  - These are composite variants and differ slightly from the canonical numbered scripts; review those files before running in production.

Follow-up recommendations
------------------------
- Consolidate into single canonical scripts and remove (or move to `variants/`) the composite/legacy files once tested.
- Optionally rename to timestamped prefixes for strict ordering.

If you want I can:
- Create a `migrations/000_full_migration.sql` that merges the canonical pieces into an idempotent script (higher-risk; review required).
- Rename duplicate/variant files to `migrations/variants/` so they're not accidentally executed.
