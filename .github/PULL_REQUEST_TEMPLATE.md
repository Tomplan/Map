# IMPORTANT

**Branch Check:**

- Use `development` for all new features and routine fixes.
- Use `main` ONLY for production releases (merging `development` → `main`) or critical hotfixes.

## Summary

Provide a short description of what this PR changes and why.

## Target

- Target branch: `development` (unless this is a hotfix for `main` or a release PR — explain why)

## Checklist

- [ ] Tests added or updated
- [ ] Linting passes (run `npm run lint`)
- [ ] Built locally (`npm run build`) and smoke-checked
- [ ] CI pipeline green (automated checks)

## QA / Acceptance

- [ ] Manual QA steps included, with expected results
- [ ] Accessibility check (keyboard nav, contrast) if UI changes
- [ ] Performance considerations noted (bundle size, relevant metrics)

## Related issues

- Fixes: # (issue number)

---

If this is a release PR: link to the release candidate branch and list specific QA validation steps.
