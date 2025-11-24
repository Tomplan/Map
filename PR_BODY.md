Title: migrations: normalize filenames, add bootstrap wrapper and docs

Summary
-------
This branch normalizes migration filenames to numeric prefixes, archives composite/variant migration scripts, and adds documentation and a bootstrap wrapper to make migration ordering explicit.

What changed
------------
- Renamed canonical migration files to numeric prefixes (01_.. → 20_..).
- Moved composite/variant scripts to `migrations/variants/` to avoid accidental execution.
- Added `migrations/README.md` and `migrations/ORDER.md` describing canonical run order and safety notes.
- Added `migrations/00_bootstrap.sql` — a psql `\i` wrapper that sequences the canonical migrations in order (documentation / convenience only).
- Updated docs that referenced old filenames (`MIGRATION_GUIDE.md`, `TRANSLATION_DEPLOYMENT.md`, `CATEGORY_SYSTEM_PLAN.md`) to the new numeric names.

Why
---
- Improve clarity and reduce risk of running duplicate or out-of-order migration scripts.
- Provide a clear, single entry point for bootstrapping a fresh DB (review before executing).

Files of interest
-----------------
- Canonical migrations now live in `migrations/` as numeric-prefixed files `01_...` .. `20_...`.
- Variant/composite scripts moved to `migrations/variants/`.
- `migrations/00_bootstrap.sql` — wrapper that includes canonical SQL files in order.
- `migrations/README.md`, `migrations/ORDER.md` — usage and run-order documentation.
- `migrations/CLEANUP.md` — (see branch) lists canonical vs archived files and recommended follow-ups.

Repository scan results
-----------------------
I ran a repo-wide scan for references to the old migration filenames (e.g. `001_create_companies_and_assignments.sql`, `002_migrate_data.sql`, etc.) and found no remaining matches in the repository. Documentation files that previously referenced the old names have been updated.

Reviewer checklist
------------------
- [ ] Confirm any CI/deploy scripts outside this repo (e.g., infra automation) do not reference old filenames.
- [ ] Review `migrations/ORDER.md` and ensure ordering matches your intended deployment plan.
- [ ] Run the bootstrap sequence in a staging DB following `ORDER.md` (or run files individually) and verify behavior.
- [ ] Confirm `migrations/variants/` contains the composite scripts for reference and that they should remain archived.

How to create the PR
--------------------
A PR can be opened on GitHub using this prefilled URL (opens new PR page):
https://github.com/Tomplan/Map/pull/new/migrations/bootstrap

(Branch `migrations/bootstrap` is already pushed to origin.)

Notes
-----
- The bootstrap wrapper is a convenience script for bootstrapping new environments. It is NOT an idempotent, transactional migration runner — review and run it only in staging or when provisioning a fresh DB.
- All renames are tracked by git and reversible.
