-- Bootstrap wrapper: run the canonical numbered migration files in order.
-- Review each file before executing on production. This file only includes other SQL files
-- using psql's `\i` include directive. It does not execute anything by itself.

\i 01_create_organization_profile.sql
\i 02_rename_organization_profile.sql
\i 03_create_marker_defaults.sql
\i 04_create_companies_and_assignments.sql
\i 05_create_company_translations.sql
\i 06_create_user_roles.sql
\i 07_allow_admins_read_user_roles.sql
\i 08_allow_admins_invite_users.sql
\i 09_create_event_subscriptions.sql
\i 10_add_event_defaults_columns.sql
\i 11_add_branding_columns.sql
\i 12_create_categories_system.sql
\i 13_create_event_activities.sql
\i 14_add_show_location_type_badge.sql
\i 15_seed_event_activities.sql
\i 16_create_feedback_system.sql
\i 17_migrate_data.sql
\i 18_drop_booth_number.sql
\i 19_fix_feedback_update_policy.sql
\i 20_fix_organization_profile_rls.sql
