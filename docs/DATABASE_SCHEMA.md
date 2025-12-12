# Database Schema Documentation

## Current Database Structure (2025-11-30)

This document outlines the current active database schema after all migrations have been applied.

## Active Tables

### Core Event Management

- **companies**: Exhibitor information and reusable company data
- **event_subscriptions**: Event-specific logistics per year (booth requirements, meal counts, contact overrides)
- **assignments**: Company-to-booth marker mappings for each event year
- **assignments_archive**: Historical assignment data for previous years

### Content Management

- **Markers_Core**: Core marker positioning and basic data
- **Markers_Appearance**: Visual styling and sizing for markers
- **Markers_Content**: **PARTIAL DEPRECATION** - Only used for special markers (ID >= 1000). Booth content moved to Companies table.

### System Configuration

- **organization_profile**: Singleton table with event branding, settings, and defaults
- **user_roles**: Secure role-based access control
- **categories**: Company categorization system
- **category_translations**: Bilingual category names
- **company_categories**: Many-to-many relationship between companies and categories

### Event Content

- **event_activities**: Bilingual program content and schedule
- **feedback_requests**: Visitor feedback system
- **user_preferences**: User-specific settings and preferences
- **organization_settings**: Organization-wide configuration options

### Utility Tables

- **company_translations**: Bilingual company information
- **marker_defaults**: System defaults for marker creation (-1, -2 records)

## Deprecated Tables

### Ready for Removal

- **Markers_Admin**: **DEPRECATED** - All code references removed. Table can be dropped after backup verification.
  - Fields: `id`, `contact`, `phone`, `email`, `boothCount`, `area`, `coins`, `breakfast`, `lunch`, `bbq`, `notes`, `adminLocked`
  - Migration: Data moved to `event_subscriptions` table

### Partial Deprecation

- **Markers_Content**: **PARTIAL DEPRECATION**
  - Status: Still used for special markers (ID >= 1000)
  - Deprecated for: Booth content (ID < 1000) - now managed via Companies/Assignments
  - Action: Keep table but marked as legacy for special markers only

## Table Relationships

```
Event Year Selection
    ↓
Markers_Core + Markers_Appearance + Markers_Content (special markers)
    ↓
Assignments ←→ Companies ←→ Company_Categories ←→ Categories
    ↓
Event_Subscriptions (year-specific logistics)
```

## Migration History Summary

- **Phase 1-4 (2025-11)**: New admin architecture implemented
- **2025-11-20**: Complete migration from Markers_Admin to Event_Subscriptions
- **2025-11-20**: AdminDashboard.jsx removed, replaced with AdminLayout + individual components
- **2025-11-20**: Old useEventMarkers.js removed, replaced with useEventMarkers_v2.js

## Data Integrity Notes

1. **Company Data**: Reusable across years via `companies` table
2. **Event Logistics**: Year-specific via `event_subscriptions`
3. **Booth Assignments**: Year-specific via `assignments`
4. **Special Markers**: Still use legacy `Markers_Content` (ID >= 1000)
5. **Role System**: Secure role-based access via `user_roles` table

## Backup Priority (Free Supabase)

Critical tables to backup before any schema changes:

1. `companies` - Exhibitor data
2. `event_subscriptions` - Event logistics
3. `assignments` - Booth mappings
4. `organization_profile` - Branding/settings
5. `Markers_Core`, `Markers_Appearance`, `Markers_Content` - Map data

## Future Schema Changes

For future development:

- Use Supabase dashboard for direct table modifications
- Document changes in this file
- Consider creating export/import utilities for data migration
- Maintain backward compatibility for special markers in Markers_Content

---

_Generated: 2025-11-30_  
_Repository Cleanup Phase_
