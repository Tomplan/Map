# Admin Panel Architecture

This document describes the new role-based admin panel architecture implemented in November 2025.

## Overview

The admin panel uses a **desktop-optimized** sidebar navigation with **role-based access control**. Different user roles see different sections based on their permissions.

## User Roles

### 1. Super Admin (`super_admin`)

**Full access to all features**

Sections visible:

- Dashboard
- Map Management
- Companies
- Event Subscriptions
- Assignments
- Settings

### 2. System Manager (`system_manager`)

**Technical/map administrators** - manages marker positioning and styling

Sections visible:

- Dashboard
- Map Management

### 3. Event Manager (`event_manager`)

**Business users** - manages companies and booth assignments

Sections visible:

- Dashboard
- Companies
- Event Subscriptions
- Assignments

## Architecture Components

### AdminLayout.jsx

**Role**: Main layout wrapper with sidebar navigation

Features:

- Left sidebar (256px fixed width)
- Navigation items filtered by user role
- Active route highlighting
- Logout button
- Uses React Router `<Outlet />` for nested routes

### useUserRole Hook

**Location**: `/src/hooks/useUserRole.js`

Features:

- Reads role from Supabase `user_metadata.role`
- Provides helper functions: `hasRole()`, `hasAnyRole()`
- Boolean flags: `isSuperAdmin`, `isSystemManager`, `isEventManager`
- Listens to auth state changes

### ProtectedSection Component

**Location**: `/src/components/ProtectedSection.jsx`

Usage:

```jsx
<ProtectedSection requiredRole="system_manager">
  <MapManagement />
</ProtectedSection>

<ProtectedSection requiredRole={['super_admin', 'event_manager']}>
  <CompaniesTab />
</ProtectedSection>
```

Behavior:

- Shows children if user has required role
- Shows "Access Restricted" message otherwise
- Super admin always has access

## Routes Structure

```
/admin (AdminLayout wrapper)
├── / (index) → Dashboard
├── /map → MapManagement (system_manager, super_admin)
├── /companies → CompaniesTab (event_manager, super_admin)
├── /subscriptions → EventSubscriptionsTab (event_manager, super_admin)
├── /assignments → AssignmentsTab (event_manager, super_admin)
└── /settings → Settings (super_admin)
```

**Login Flow**:

- Unauthenticated users see AdminLogin + FeedbackForm at `/admin/*`
- After login, redirected to AdminLayout with role-based navigation

## Admin Sections

### 1. Dashboard

**Location**: `/src/components/admin/Dashboard.jsx`
**Access**: All roles

Features:

- Stats overview cards (markers, companies, subscriptions, assignments)
- Quick action links
- Placeholder for recent activity

### 2. Map Management

**Location**: `/src/components/admin/MapManagement.jsx`
**Access**: System Manager, Super Admin

Features:

- **Master-detail layout**: List of markers (left) + edit panel (right)
- **Search/filter**: By ID, booth label, or name
- **Unified editing** - merges old Core/Appearance/Content tabs:
  - **Position & Structure**: lat, lng, rectangle, angle
  - **Visual Styling**: icon, icon size, glyph, colors
  - **Special Markers Content** (ID >= 1000 only): name, logo, website, info
- **Booth markers** (ID < 1000): Content is read-only, managed via Companies/Assignments
- Edit mode with save/cancel

**Replaces**:

- Old AdminDashboard Core tab
- Old AdminDashboard Appearance tab
- Old AdminDashboard Content tab

### 3. Companies

**Location**: `/src/components/admin/CompaniesTab.jsx`
**Access**: Event Manager, Super Admin

Features:

- Permanent company catalog (reusable across years)
- CRUD operations
- Dual-section form: Public Info + Manager-Only Info
- Logo upload
- Search/filter

### 4. Event Subscriptions

**Location**: `/src/components/admin/EventSubscriptionsTab.jsx`
**Access**: Event Manager, Super Admin

Features:

- Year-specific company subscriptions
- Contact overrides (override company defaults)
- Booth count, area preference
- Meal counts (Saturday/Sunday breakfast/lunch/BBQ)
- Coins needed
- Notes
- Archive functionality
- Copy from previous year

### 5. Assignments

**Location**: `/src/components/admin/AssignmentsTab.jsx`
**Access**: Event Manager, Super Admin

Features:

- Matrix view: Companies (rows) × Markers (columns)
- Click to toggle assignments
- Shows only subscribed companies
- Sort by company name, marker ID, or unassigned
- Archive functionality

### 6. Settings

**Location**: Placeholder
**Access**: Super Admin only

Planned features:

- Organization profile
- Branding settings
- User management

## Data Model

### Markers (4 tables for backward compatibility)

1. **Markers_Core**: `id`, `lat`, `lng`, `rectangle`, `angle`, `coreLocked`
2. **Markers_Appearance**: `id`, `glyph`, `iconUrl`, `iconSize`, `glyphColor`, etc.
3. **Markers_Content**: `id`, `name`, `logo`, `website`, `info`, `contentLocked`
   - ⚠️ For booths (ID < 1000): Read-only, deprecated
   - ✅ For special markers (ID >= 1000): Active
4. **Markers_Admin**: ⚠️ **DEPRECATED** - Being migrated to Event_Subscriptions

### New Tables (Preferred)

1. **Companies**: Permanent company catalog
2. **Event_Subscriptions**: Year-specific company subscriptions with logistics
3. **Assignments**: Many-to-many (marker ↔ company) for specific year

### Relationship Flow

```
Markers_Core (booths)
    ↓
Assignments ← → Companies
    ↓              ↓
event_year    Event_Subscriptions
              (booth requirements,
               meal counts,
               contact overrides)
```

## Setting User Roles

Roles are stored in Supabase `auth.users.user_metadata.role`.

**To set a role**:

```sql
-- Using Supabase SQL editor
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'admin@example.com';
```

**Or via Supabase JavaScript**:

```javascript
const { data, error } = await supabase.auth.updateUser({
  data: { role: 'super_admin' },
});
```

**Valid roles**:

- `super_admin`
- `system_manager`
- `event_manager`

## Best Practices

### For System Managers

- Use Map Management for marker positioning only
- Don't edit booth content (managed by Event Managers)
- Lock markers when positioning is finalized (`coreLocked`, `appearanceLocked`)

### For Event Managers

- Manage companies in Companies tab (permanent catalog)
- Create yearly subscriptions in Event Subscriptions
- Assign booths in Assignments tab
- Don't modify marker positions or icons

### For Developers

- Check role before showing/hiding features: `useUserRole()`
- Wrap protected components with `<ProtectedSection>`
- Super admin always has full access
- Desktop-optimized design (not mobile-responsive for admin)

## Migration from Old Admin

**Old Pattern** (Deprecated):

```jsx
<AdminDashboard markersState={markersState} setMarkersState={setMarkersState} />
```

**New Pattern**:

```jsx
<Routes>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="map" element={<MapManagement />} />
    {/* etc */}
  </Route>
</Routes>
```

See [DEPRECATED.md](./DEPRECATED.md) for full migration guide.

## Future Enhancements

- [ ] Add real-time stats to Dashboard
- [ ] Implement Settings page (organization profile, branding)
- [ ] Add user management for Super Admin
- [ ] Activity logging/audit trail
- [x] Complete Markers_Admin → Event_Subscriptions migration (2025-11-20)
- [x] Remove AdminDashboard.jsx after migration complete (2025-11-20)
- [ ] Add role management UI for Super Admin
- [ ] Keyboard shortcuts for common actions
- [ ] Bulk operations (multi-select markers, batch assign)
- [ ] Export/import functionality
