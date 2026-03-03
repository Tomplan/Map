# Migration Guide: Companies and Assignments System

## Overview

This migration separates **Companies** (permanent, reusable) from **Markers** (physical locations), and introduces **Assignments** to link them on a yearly basis.

---

## 🎯 **New Architecture**

### **Before:**

- `Markers_Content` contained company data tied directly to markers
- Had to duplicate company data for multiple booths
- Couldn't reuse company data year-over-year

### **After:**

- `Companies` - Permanent list of companies (grows over time)
- `Markers_Core` - Physical booth locations (unchanged)
- `Markers_Appearance` - Visual styling (unchanged)
  - Note: Recent migration added per-marker sizing fields to `Markers_Appearance`. The new approach consolidates sizing around the existing `iconSize` and `glyphSize` columns: a backfill-only migration copies values from `iconBaseSize`/`glyphBaseSize` into `iconSize`/`glyphSize` for rows where those fields were empty. Legacy `iconBaseSize`/`glyphBaseSize` columns remain in the DB until you confirm removal.
- `Assignments` - Yearly mapping of Companies → Markers
- `Assignments_Archive` - Historical data for previous years

---

## 📋 **Migration Steps**

### **Step 1: Run SQL Migrations in Supabase**

1. Go to Supabase Dashboard → SQL Editor
2. Run `migrations/04_create_companies_and_assignments.sql`
   - Creates Companies table
   - Creates Assignments table
   - Creates Assignments_Archive table
   - Sets up RLS policies
   - Creates helper functions

3. Run `migrations/17_migrate_data.sql`
   - Migrates existing Markers_Content → Companies
   - Creates Assignments for 2025
   - Verifies data integrity

### **Step 2: Verify Migration**

Check in Supabase:

```sql
-- Should match Markers_Content count
SELECT COUNT(*) FROM Companies;

-- Should match active markers with content
SELECT COUNT(*) FROM Assignments WHERE event_year = 2025;

-- Verify join works
SELECT
  m.id, m.lat, m.lng,
  a.booth_number,
  c.name, c.logo
FROM Markers_Core m
LEFT JOIN Assignments a ON m.id = a.marker_id AND a.event_year = 2025
LEFT JOIN Companies c ON a.company_id = c.id
LIMIT 5;
```

---

## 🔧 **Code Changes**

### **New Hooks Available:**

#### **useCompanies()**

```javascript
import useCompanies from './hooks/useCompanies';

const {
  companies, // All companies
  loading,
  createCompany, // Add new company
  updateCompany, // Edit company
  deleteCompany, // Remove company
  searchCompanies, // Search by name
} = useCompanies();
```

#### **useAssignments(eventYear)**

```javascript
import useAssignments from './hooks/useAssignments';

const {
  assignments, // All assignments for year
  loading,
  assignCompanyToMarker, // Create assignment
  unassignCompanyFromMarker, // Remove assignment
  getMarkerAssignments, // Get companies for a marker
  getCompanyAssignments, // Get markers for a company
  archiveCurrentYear, // Archive and start fresh
  loadArchivedAssignments, // View previous year
} = useAssignments(2025);
```

#### **useEventMarkers(eventYear)**

Updated version that loads markers with assignments:

```javascript
import useEventMarkers from './hooks/useEventMarkers';

const { markers, loading, isOnline } = useEventMarkers(2025);

// Each marker now has:
// - assignments: [] - Array of all assigned companies
// - name, logo, etc. - Primary assignment (backward compatible)
```

---

## 🎨 **New Admin Features**

### **Companies Tab** (To be implemented)

- View all companies
- Add/edit/delete companies
- Search companies
- Import/export company list

### **Assignments Tab** (To be implemented)

- Grid view: Markers (rows) × Companies (columns)
- Drag-and-drop to assign
- View previous years
- Bulk assign/unassign
- Archive current year

### **Right-Click Assignment** (To be implemented)

- Right-click marker on map
- Select from companies list
- Assign booth number
- Quick unassign

---

## 📅 **Yearly Workflow**

### **Preparing for a New Event Year:**

1. **View Previous Year** (Optional)

   ```javascript
   const { loadArchivedAssignments } = useAssignments(2026);
   const { data } = await loadArchivedAssignments(2025);
   // Use as reference for new assignments
   ```

2. **Archive Previous Year**

   ```javascript
   const { archiveCurrentYear } = useAssignments(2025);
   await archiveCurrentYear(); // Moves 2025 to archive
   ```

3. **Create New Assignments for 2026**
   ```javascript
   const { assignCompanyToMarker } = useAssignments(2026);
   await assignCompanyToMarker(markerId, companyId, 'A12');
   ```

---

## 🔒 **Security (RLS Policies)**

### **Companies:**

- ✅ Public read (anyone can view)
- ✅ Admin write (only authenticated)

### **Assignments:**

- ✅ Public read (anyone can view current year)
- ✅ Admin write (only authenticated)

### **Assignments_Archive:**

- ✅ Admin only (read and write)

---

## 🔄 **Backward Compatibility**

The new `useEventMarkers` maintains backward compatibility:

- `marker.name`, `marker.logo`, etc. still work
- Primary assignment is spread at marker level
- New `marker.assignments` array available

### **Migration Path:**

1. Run SQL migrations ✅
2. Test with `useEventMarkers` ✅
3. Update components gradually
4. Eventually deprecate `Markers_Content`

---

## ✨ **Benefits**

1. **Reusable Company Data** - Add once, use every year
2. **Multiple Assignments** - One company → multiple booths
3. **Historical Data** - View previous years
4. **Cleaner Separation** - Companies ≠ Markers
5. **Easier Management** - Dedicated Companies and Assignments UIs

---

## 🚀 **Next Steps**

1. ✅ Run migrations in Supabase
2. ✅ Verify data migration success
3. ⏳ Implement Companies tab UI
4. ⏳ Implement Assignments tab UI
5. ⏳ Add right-click assignment
6. ⏳ Test thoroughly
7. ⏳ Deploy to production

---

## 📝 **Notes**

- Keep `Markers_Content` as backup for now
- Can eventually drop `Markers_Content` when confident
- Archive function is available for yearly cleanup
- All changes are backward compatible

---

## 🆘 **Rollback Plan**

If needed, you can rollback:

```sql
-- Restore from backup
DROP TABLE Companies CASCADE;
DROP TABLE Assignments CASCADE;
DROP TABLE Assignments_Archive CASCADE;

-- Markers_Content still exists and unchanged
```

---

## 📞 **Support**

If you encounter issues:

1. Check Supabase logs
2. Verify RLS policies
3. Check browser console for errors
4. Review migration verification queries
