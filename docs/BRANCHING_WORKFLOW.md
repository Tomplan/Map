# Branching workflow — recommended (safe, simple)

This repository follows a simple, safe workflow intended for small teams and fast iteration while keeping a clean production branch.

Primary goals
- Keep `development` as the primary working branch where daily feature work lands.
- Keep `main` reserved for production-ready releases; merge to `main` only after review and QA.
- Use short-lived `feature/*` branches for individual PRs targeting `development`.
- Use `release` or `staging` branches to coordinate QA/manager testing prior to production merge.
- Use `hotfix/*` branches for emergency patches off `main` (merge back into both `main` and `development`).

Branches and responsibilities
- `development` — Active development branch. All feature branches and PRs should target `development`.
  - CI runs on PRs and pushes to `development`.
  - Use reviews and automated checks to validate changes.
- `feature/*` — Short-lived branches created off `development` for a single feature/fix.
  - Create PRs from `feature/*` → `development`.
  - Keep them small and focused; close or merge quickly.
- `release` or `staging` — Optional branch(es) where deploy preview / QA testing happens.
  - Create from `development` when preparing a release candidate.
  - Use for staged testing and acceptance by product owners / QA.
- `main` — Production-only branch. Merge from `release` (or `development` only when explicitly approved).
  - Protect `main`: require PR reviews, passing CI, and any required status checks or approvals.
- `hotfix/*` — Emergency fixes created off `main`.
  - After patching, merge `hotfix/*` → `main` and `hotfix/*` → `development` (or into the next `release`).

Pull request rules & CI
- All PRs should have a clear description of intent, testing steps, and expected user impact.
- PRs targeting `development` must pass CI (tests, lint, build) before merging.
- Use review approvals and short testing checklists for QA validation.

Release flow (recommended)
1. Work on `feature/*` branches; open PRs into `development`.
2. When `development` is ready for a release, create a `release/` branch (or `staging`) and run staging QA.
3. Once QA signs off, open a PR from `release` → `main` and merge after CI passes.
4. Tag the `main` commit as your release and deploy.

Branch protection & automation
- Protect `main` to require status checks, minimum review approvals, and disallow force pushes.
- Optionally protect `development` to require PRs for changes and passing CI, but allow regular merges for day-to-day work.

Automation helper
-----------------
The repository includes a small helper script `scripts/setup-branch-protection.sh` that uses the GitHub CLI to apply branch protection settings to `main` and `development` (it requires `gh` + `jq` and an account with admin rights on the repo).

Example:

```bash
# from the repo root (gh configured and logged in):
GITHUB_REPO=Tomplan/Map ./scripts/setup-branch-protection.sh
```

The script sets a minimal set of protections (status checks required + one approving review). Modify the script for your preferred rules before running it.

Tools & housekeeping
- Use small, frequent PRs and meaningful commit messages.
- Keep branches short-lived and delete them after merge.
- Add PR templates and automation (CI, PR checks, status checks) to make the process frictionless.

See also: `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/` for PR/issue conventions and QA checklists.
