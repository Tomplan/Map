# Restore Request: revert regressions from 2025-12-15

Summary:
- A set of commits introduced on `fix/safe-default-safeMarkers` on 2025-12-15 caused regressions (failing tests and runtime issues).
- Snapshot of the broken state preserved on `snapshot/before-regression-2025-12-15`.
- Regression report: `regressions/report-2025-12-15.md` (contains failing test outputs and changed-files list).

Proposed action (non-destructive, recommended):
1. Review this PR and the regression report.
2. If approved, reset `fix/safe-default-safeMarkers` to match `origin/development` (fast, non-destructive since snapshot branch preserves changes):
   - `git checkout fix/safe-default-safeMarkers`
   - `git reset --hard origin/development`
   - `git push --force` (requires approval from repo maintainers)
3. Alternatively, cherry-pick individual fixes from `snapshot/before-regression-2025-12-15` to a new branch and open a follow-up PR with tests fixed.

If you'd like me to perform the reset (force-push) I can do so after you approve.

