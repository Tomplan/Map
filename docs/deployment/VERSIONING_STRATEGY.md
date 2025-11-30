# Versioning Strategy

## Current Status: Not Implemented (v0.0.0)

**Decision Date:** November 21, 2025  
**Status:** Pre-production, active development  
**Recommendation:** Do NOT implement versioning yet

---

## Why NOT to Version Now

### 1. Active Development Phase
- Still building core features (subscriptions, assignments, logos)
- Breaking changes are expected and acceptable
- Versioning overhead slows development velocity
- No external users relying on stable APIs

### 2. Simple Use Case
- Admin-only app (5-10 internal users max)
- We control deployment timing
- Can update help content live without user confusion
- No public-facing documentation requiring version syncing

### 3. Unnecessary Complexity
- Changelog maintenance overhead
- Version-specific help content storage
- Migration guide creation between versions
- Semantic versioning discipline (major.minor.patch)

---

## When to Implement Versioning

**Add versioning when ANY of these occur:**

1. ✅ **v1.0 Production Launch** - Going live for real event with external users
2. ✅ **Multiple Organizations** - Other event organizations using the app
3. ✅ **External API Integrations** - Other systems depend on our data structure
4. ✅ **Rollback Requirement** - Need to maintain stable + beta versions
5. ✅ **6+ Months Stable Operation** - Mature codebase with established patterns
6. ✅ **Managers Ask** - "What changed since last time?" or "Which version has that bug?"

---

## Current Approach: Simple Change Tracking

### Phase 1: Build Help Without Versions ✅

**Implementation:**
```javascript
// src/config/helpContent.js
export const helpContent = {
  dashboard: {
    title: "Dashboard Overview",
    content: "View key metrics and statistics...",
    updated: "2025-11-21" // Just date, no version
  },
  companies: { /* ... */ },
  // etc.
}
```

**Benefits:**
- Fast to build and update
- No version complexity
- Easy to maintain
- Sufficient for current needs

### Phase 2: Informal Change Log

**"What's New" Section in Help Panel:**
```javascript
// src/config/whatsNew.js
export const whatsNew = [
  {
    date: "2025-11-21",
    changes: [
      "Added in-app help system",
      "Improved marker tooltips",
      "Enhanced logo uploader"
    ]
  },
  {
    date: "2025-11-15",
    changes: [
      "Added event subscriptions tab",
      "Fixed import validation"
    ]
  },
  // Add new items at top
]
```

**Usage:** Show last 5-10 items in help panel

---

## Future Implementation Plan

### When Ready (6+ Months from Now)

#### Step 1: Add Version Display

**Update package.json:**
```json
{
  "version": "1.0.0"  // Change from 0.0.0
}
```

**Add to vite.config.js:**
```javascript
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  // ... rest of config
});
```

**Display in AdminLayout Footer:**
```jsx
// src/components/AdminLayout.jsx
<footer className="text-xs text-gray-500 text-center py-2">
  Event Map App v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
</footer>
```

#### Step 2: Create CHANGELOG.md

**Format (Keep the Changelog standard):**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Features in development

## [1.1.0] - 2025-12-15

### Added
- New marker rotation feature
- Bulk import validation

### Changed
- Improved logo upload UX
- Updated dashboard metrics

### Fixed
- Import CSV encoding issue
- Marker drag performance

### Deprecated
- Old CSV format (will be removed in 2.0.0)

## [1.0.0] - 2025-11-25

### Added
- Initial production release
- Full admin dashboard
- Map management
- Company and subscription tracking
```

#### Step 3: Semantic Versioning Rules

**Format:** `MAJOR.MINOR.PATCH`

**When to Increment:**

- **MAJOR (1.0.0 → 2.0.0):** Breaking changes
  - Database schema changes requiring migration
  - Removed features or APIs
  - Changed data formats incompatible with old versions

- **MINOR (1.0.0 → 1.1.0):** New features (backward compatible)
  - New admin features
  - New map layers or marker types
  - Enhanced import/export capabilities

- **PATCH (1.0.0 → 1.0.1):** Bug fixes
  - Fixed bugs
  - Performance improvements
  - Minor UI tweaks

#### Step 4: Version-Aware Help (If Needed)

**Only if help varies significantly between versions:**

```javascript
// src/config/helpContent.js
export const helpContentByVersion = {
  "1.0.0": {
    dashboard: {
      title: "Dashboard Overview",
      content: "v1.0 dashboard content..."
    }
  },
  "1.1.0": {
    dashboard: {
      title: "Dashboard Overview",
      content: "v1.1 dashboard with new features..."
    }
  }
};

// Helper to get content for current version
export function getHelpContent(page) {
  const currentVersion = import.meta.env.VITE_APP_VERSION;
  return helpContentByVersion[currentVersion]?.[page] 
    || helpContentByVersion["1.0.0"][page]; // Fallback
}
```

#### Step 5: Migration System (If Needed)

**Only if breaking changes require data migration:**

```javascript
// src/utils/migrations.js
export const migrations = {
  "1.0.0": async (data) => {
    // No migration needed (initial)
    return data;
  },
  "2.0.0": async (data) => {
    // Example: Migrate old marker format to new
    return {
      ...data,
      markers: data.markers.map(m => ({
        ...m,
        newField: calculateNewValue(m)
      }))
    };
  }
};

export async function migrateData(fromVersion, toVersion, data) {
  // Run migrations in sequence
  // Implementation details...
}
```

---

## Release Process (Future)

### When Releasing a New Version:

1. **Update package.json** version number
2. **Update CHANGELOG.md** with changes
3. **Create git tag:** `git tag v1.1.0`
4. **Update help content** if needed
5. **Test in staging** environment
6. **Deploy to production**
7. **Announce to managers** via email/Slack

### Version Naming Convention:

- **Development:** `0.x.x` (unstable, breaking changes OK)
- **Beta:** `1.0.0-beta.1` (testing phase)
- **Release Candidate:** `1.0.0-rc.1` (final testing)
- **Production:** `1.0.0` (stable)

---

## Tools to Consider (Later)

- **semantic-release:** Automate version bumps based on commit messages
- **changesets:** Manage versions in monorepo/multi-package projects
- **standard-version:** Automate changelog generation
- **conventional commits:** Structured commit messages for automation

---

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2025-11-21 | Do NOT implement versioning | Active development, no external users, unnecessary overhead |
| TBD | Implement v1.0.0 | Production launch or external users |

---

## Summary

**Current Strategy:**
- ✅ Keep at v0.0.0 during development
- ✅ Use date-based "What's New" tracking
- ✅ Build help system without version awareness
- ✅ Maintain informal change log

**Future Strategy (When Needed):**
- ⏰ Bump to v1.0.0 at production launch
- ⏰ Add version display in UI footer
- ⏰ Start maintaining CHANGELOG.md
- ⏰ Implement semantic versioning
- ⏰ Add version-aware help only if necessary

**Review this strategy in 6 months or when reaching production launch.**
