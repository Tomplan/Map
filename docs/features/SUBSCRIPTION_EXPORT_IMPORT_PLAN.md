# Subscription Export/Import Implementation Plan

## Overview

This document outlines the comprehensive plan to implement export/import functionality for event subscriptions, following the established patterns from the existing companies export/import system.

## Current State Analysis

### ✅ Existing Infrastructure
- **Database Schema**: `event_subscriptions` table with comprehensive fields
- **Data Configuration**: Partial configuration exists in `src/config/dataConfigs.js`
- **UI Components**: `EventSubscriptionsTab.jsx` with robust subscription management
- **Hooks**: `useEventSubscriptions.js` with full CRUD operations
- **Export/Import Framework**: Established pattern in `dataExportImport.js`
- **Validation System**: Reusable validation utilities

### ❌ Missing Components
- Export/Import buttons in EventSubscriptionsTab
- Complete subscription data transformation logic
- Year selection UI for export/import
- Enhanced validation rules for subscriptions
- Bulk import progress tracking integration

## Implementation Plan

### Phase 1: Complete Data Configuration

**File**: `src/config/dataConfigs.js`

#### Current subscription configuration already includes:
```javascript
event_subscriptions: {
  label: 'Event Subscriptions',
  table: 'event_subscriptions',
  yearDependent: true,
  
  exportColumns: [
    { key: 'id', header: 'Subscription ID', type: 'number' },
    { key: 'company_name', header: 'Company Name', type: 'string', required: true },
    { key: 'event_year', header: 'Event Year', type: 'number', required: true },
    // ... other columns
  ],
  
  transformExport: (subscriptions) => { /* exists */ },
  transformImport: (row, companyMap, eventYear) => { /* exists */ },
  validateRow: (row, rowIndex, companyMap) => { /* exists */ },
  matchStrategy: { /* exists */ }
}
```

#### Enhancement needed:
- Improve company name joining logic
- Add comprehensive field validation
- Enhance error messaging for subscription-specific issues

### Phase 2: UI Integration

**File**: `src/components/admin/EventSubscriptionsTab.jsx`

#### Add Export/Import Buttons
```jsx
// Add to header section alongside existing action buttons
<div className="flex gap-2">
  <ExportButton
    dataType="event_subscriptions"
    data={subscriptions}
    additionalData={{ 
      supabase,
      eventYear: selectedYear 
    }}
    filename={`subscriptions-${selectedYear}-${new Date().toISOString().split('T')[0]}`}
  />
  <ImportButton
    dataType="event_subscriptions"
    existingData={subscriptions}
    eventYear={selectedYear}
    additionalData={{ 
      supabase,
      selectedYear 
    }}
    onImportComplete={async () => {
      await loadSubscriptions();
    }}
  />
  {/* existing buttons */}
</div>
```

#### Key Features:
- **Year-aware export**: Only export subscriptions for selected year
- **Company validation**: Ensure imported companies exist in database
- **Bulk operations**: Handle large subscription datasets efficiently
- **Progress tracking**: Use existing progress bar implementation

### Phase 3: Enhanced Data Transformation

**File**: `src/config/dataConfigs.js`

#### Export Enhancement
```javascript
transformExport: async (subscriptions, additionalData) => {
  const { supabase, eventYear } = additionalData || {};
  
  // Enhanced export with company details and assignment info
  const enhancedSubscriptions = await Promise.all(
    subscriptions.map(async (sub) => {
      // Get booth assignments for this subscription
      const { data: assignments } = await supabase
        .from('assignments')
        .select('markers_core(glyph)')
        .eq('company_id', sub.company_id)
        .eq('event_year', eventYear);

      const boothLabels = assignments
        ?.map(a => a.markers_core?.glyph)
        ?.filter(Boolean)
        ?.join(', ') || '';

      return {
        id: sub.id,
        company_name: sub.company?.name || '',
        event_year: sub.event_year,
        contact: sub.contact || '',
        phone: sub.phone || '',
        email: sub.email || '',
        booth_count: sub.booth_count || 1,
        booth_labels: boothLabels, // Enhanced field
        area: sub.area || '',
        breakfast_sat: sub.breakfast_sat || 0,
        lunch_sat: sub.lunch_sat || 0,
        bbq_sat: sub.bbq_sat || 0,
        breakfast_sun: sub.breakfast_sun || 0,
        lunch_sun: sub.lunch_sun || 0,
        coins: sub.coins || 0,
        notes: sub.notes || ''
      };
    })
  );

  return enhancedSubscriptions;
}
```

#### Import Enhancement
```javascript
transformImport: (row, companyMap, eventYear) => {
  const companyName = row['Company Name']?.trim();
  const companyId = companyMap[companyName?.toLowerCase()];

  if (!companyId) {
    throw new Error(`Company "${companyName}" not found in database`);
  }

  // Enhanced validation and transformation
  const transformed = {
    company_id: companyId,
    event_year: parseInt(row['Event Year']) || eventYear,
    contact: row['Contact Person']?.trim() || '',
    area: row['Area']?.trim() || '',
    notes: row['Notes']?.trim() || ''
  };

  // Phone normalization
  if (row['Phone'] && row['Phone'].trim()) {
    transformed.phone = normalizePhone(row['Phone'].trim());
  }

  // Email normalization
  if (row['Email'] && row['Email'].trim()) {
    transformed.email = row['Email'].trim().toLowerCase();
  }

  // Numeric fields with validation
  const numericFields = [
    'Booth Count', 'Event Year',
    'Breakfast (Sat)', 'Lunch (Sat)', 'BBQ (Sat)',
    'Breakfast (Sun)', 'Lunch (Sun)', 'Coins'
  ];

  numericFields.forEach(field => {
    const value = row[field];
    if (value !== undefined && value !== null && value !== '') {
      const num = parseInt(value);
      if (!isNaN(num)) {
        const key = field.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_');
        transformed[key] = num;
      }
    }
  });

  return transformed;
}
```

### Phase 4: Enhanced Validation

#### Subscription-specific validation rules:
```javascript
validateRow: (row, rowIndex, companyMap) => {
  const errors = [];

  // Required company name
  const nameValidation = validateRequired(row['Company Name'], 'Company Name');
  if (!nameValidation.valid) {
    errors.push({
      field: 'Company Name',
      message: nameValidation.error
    });
  }

  // Company existence check
  if (row['Company Name'] && companyMap) {
    const companyName = row['Company Name']?.trim().toLowerCase();
    if (!companyMap[companyName]) {
      errors.push({
        field: 'Company Name',
        message: `Company "${row['Company Name']}" not found in database`
      });
    }
  }

  // Event year validation
  const eventYear = parseInt(row['Event Year']);
  if (row['Event Year'] && (isNaN(eventYear) || eventYear < 2020 || eventYear > 2100)) {
    errors.push({
      field: 'Event Year',
      message: 'Event Year must be a valid year between 2020-2100'
    });
  }

  // Booth count validation
  const boothCount = parseInt(row['Booth Count']);
  if (row['Booth Count'] && (isNaN(boothCount) || boothCount < 1)) {
    errors.push({
      field: 'Booth Count',
      message: 'Booth Count must be at least 1'
    });
  }

  // Meal count validation (0 or positive integers)
  const mealFields = ['Breakfast (Sat)', 'Lunch (Sat)', 'BBQ (Sat)', 'Breakfast (Sun)', 'Lunch (Sun)'];
  mealFields.forEach(field => {
    const value = parseInt(row[field]);
    if (row[field] && (isNaN(value) || value < 0)) {
      errors.push({
        field: field,
        message: `${field} must be 0 or a positive integer`
      });
    }
  });

  // Coins validation
  const coins = parseInt(row['Coins']);
  if (row['Coins'] && (isNaN(coins) || coins < 0)) {
    errors.push({
      field: 'Coins',
      message: 'Coins must be 0 or a positive integer'
    });
  }

  // Email format validation
  if (row['Email'] && row['Email'].trim()) {
    const emailValidation = validateEmail(row['Email']);
    if (!emailValidation.valid) {
      errors.push({
        field: 'Email',
        message: emailValidation.error
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Phase 5: Year Selection UI

#### Enhanced Import Modal Props
```jsx
<ImportModal
  isOpen={isOpen}
  onClose={handleClose}
  dataType="event_subscriptions"
  eventYear={selectedYear} // New prop
  existingData={subscriptions}
  additionalData={{
    supabase,
    selectedYear,
    availableCompanies: companies
  }}
  onImportComplete={handleImportComplete}
/>
```

#### Year-aware validation:
- Check company existence in database
- Validate event year consistency
- Prevent duplicate subscriptions for same company/year

### Phase 6: Testing Strategy

#### Export Testing
1. **Single year export**: Export subscriptions for a specific year
2. **Empty year handling**: Export when no subscriptions exist
3. **Large dataset**: Export with 100+ subscriptions
4. **Data integrity**: Verify all fields export correctly

#### Import Testing
1. **Valid data**: Import correctly formatted subscription data
2. **Company validation**: Test import with non-existent companies
3. **Duplicate handling**: Test import of existing subscriptions
4. **Year consistency**: Test import with wrong event years
5. **Field validation**: Test all numeric and text field validations
6. **Bulk operations**: Test importing 50+ subscriptions with progress tracking

### Phase 7: User Experience Enhancements

#### Export Features
- **Smart naming**: Auto-generate filenames with year and date
- **Selective export**: Allow filtering before export
- **Preview mode**: Show what will be exported

#### Import Features  
- **Preview validation**: Show all validation errors before import
- **Selective import**: Allow choosing which records to import
- **Progress tracking**: Real-time progress with phase indicators
- **Error recovery**: Handle partial imports gracefully

## File Structure Changes

```
src/
├── config/
│   └── dataConfigs.js ✅ (enhance existing)
├── components/
│   ├── admin/
│   │   └── EventSubscriptionsTab.jsx ✅ (add buttons)
│   └── common/
│       ├── ExportButton.jsx ✅ (already supports subscriptions)
│       └── ImportModal.jsx ✅ (already supports subscriptions)
└── utils/
    └── dataExportImport.js ✅ (already supports subscriptions)
```

## Success Criteria

### Functional Requirements
- [ ] Export subscriptions to Excel/CSV/JSON with all fields
- [ ] Import subscriptions with comprehensive validation
- [ ] Year-aware operations (only selected year)
- [ ] Company existence validation
- [ ] Duplicate subscription detection
- [ ] Bulk operation progress tracking

### Technical Requirements
- [ ] Reuse existing export/import framework
- [ ] Follow established code patterns
- [ ] Maintain data integrity
- [ ] Handle edge cases gracefully
- [ ] Provide meaningful error messages

### User Experience Requirements
- [ ] Intuitive UI integration
- [ ] Clear progress indicators
- [ ] Comprehensive error reporting
- [ ] Fast performance for large datasets
- [ ] Consistent with companies export/import UX

## Estimated Implementation Time

- **Phase 1**: 1 hour (data configuration)
- **Phase 2**: 2 hours (UI integration)  
- **Phase 3**: 2 hours (data transformation)
- **Phase 4**: 1 hour (validation)
- **Phase 5**: 1 hour (year selection)
- **Phase 6**: 2 hours (testing)
- **Phase 7**: 1 hour (UX polish)

**Total**: ~10 hours development time

## Risk Assessment

### Low Risk
- ✅ Using established patterns and framework
- ✅ Database schema is stable
- ✅ Existing validation utilities

### Medium Risk
- ⚠️ Large dataset performance (mitigation: progress tracking)
- ⚠️ Complex validation logic (mitigation: comprehensive testing)

### High Risk
- ❌ None identified - implementation follows proven patterns

---

*Generated: 2025-12-02*
*Status: Ready for Implementation*