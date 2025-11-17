# Deprecated Components and Tables

This document tracks deprecated components, tables, and features that should not be used for new development.

## Deprecated Components

### AdminDashboard.jsx (DEPRECATED - 2025-11)
**Status**: Replaced by new admin panel architecture
**Replacement**: AdminLayout.jsx + individual admin components
**Reason**:
- 916-line monolithic component with mixed concerns
- Overlay pattern caused z-index conflicts with map
- Mixed old table rendering with new component tabs
- No mobile optimization
- Desktop-only hardcoded layout

**Migration Path**:
- Use `/admin/map` route for Map Management (MapManagement.jsx)
- Use `/admin/companies` for Companies management
- Use `/admin/subscriptions` for Event Subscriptions
- Use `/admin/assignments` for Assignments

**Old Tabs Mapping**:
- Core tab → MapManagement.jsx (Position & Structure section)
- Appearance tab → MapManagement.jsx (Visual Styling section)
- Content tab → MapManagement.jsx (Special Markers section)
- Companies tab → CompaniesTab.jsx at `/admin/companies`
- Event Subscriptions tab → EventSubscriptionsTab.jsx at `/admin/subscriptions`
- Assignments tab → AssignmentsTab.jsx at `/admin/assignments`

### MarkerTable.jsx (DEPRECATED - 2025-11)
**Status**: No longer used
**Replacement**: MapManagement.jsx
**Reason**: Rendered below AdminDashboard in old architecture, now redundant

## Deprecated Database Tables

### Markers_Admin (DEPRECATED - Migration in progress)
**Status**: Data being migrated to Event_Subscriptions
**Fields**: `id`, `contact`, `phone`, `email`, `boothCount`, `area`, `coins`, `breakfast`, `lunch`, `bbq`, `notes`, `adminLocked`
**Replacement**: Event_Subscriptions table
**Reason**:
- Company-specific event logistics should be tied to event year subscriptions
- Separates reusable company data from year-specific event data

**Migration Path**:
- Booth requirements (boothCount, area) → Event_Subscriptions
- Meal counts (breakfast, lunch, bbq) → Event_Subscriptions (with separate Saturday/Sunday counts)
- Contact info → Event_Subscriptions (as overrides to company defaults)
- Notes → Event_Subscriptions
- `adminLocked` field → Remove (no longer needed)

### Markers_Content (PARTIAL DEPRECATION)
**Status**: Still used for special markers (ID >= 1000), deprecated for booths (ID < 1000)
**Fields**: `id`, `name`, `logo`, `website`, `info`, `contentLocked`
**Replacement**:
- For booths (ID < 1000): Companies table + Assignments table
- For special markers (ID >= 1000): Still active

**Reason**:
- Booth content (name, logo, website) should come from reusable Companies table
- Assignments table links companies to specific booth markers for each year
- Special markers (parking, food, events) still need marker-specific content

**Current Usage**:
- Booths: Read-only in admin (managed via Companies/Assignments)
- Special Markers: Fully editable in MapManagement.jsx

## Deprecated Code Patterns

### "admin" Tab References
**Status**: Phantom code - tab never existed in TABS config
**Location**: AdminDashboard.jsx (lines 72-75, 312-314, etc.)
**Reason**: Old code referencing non-existent tab, creates dead code branches
**Action**: Remove all `activeTab === 'admin'` conditionals

### adminLocked Field
**Status**: References should be removed
**Location**: Throughout AdminDashboard.jsx
**Replacement**: Use `coreLocked` and `appearanceLocked` only
**Reason**: Markers_Admin table being deprecated, so lock field is no longer needed

### Overlay Pattern for Admin
**Status**: Removed
**Old Pattern**:
```javascript
<div className="absolute inset-5 ... z-40 opacity-0.9">
  {/* Dashboard overlay */}
</div>
```
**New Pattern**: Dedicated route with AdminLayout sidebar

## Migration Timeline

- ✅ **Phase 1-4 Complete** (2025-11): New admin architecture implemented
- 🔄 **In Progress**: Data migration from Markers_Admin to Event_Subscriptions
- ⏳ **Pending**: Remove AdminDashboard.jsx after confirming all functionality migrated
- ⏳ **Pending**: Clean up Markers_Content usage for booth markers

## Notes for Developers

1. **DO NOT** use AdminDashboard.jsx for new features
2. **DO NOT** write to Markers_Admin table
3. **DO** use new role-based admin routes (super_admin, system_manager, event_manager)
4. **DO** use MapManagement.jsx for marker positioning/styling
5. **DO** use Companies/Event_Subscriptions/Assignments for booth management
