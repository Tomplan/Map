# Tooltip Integration Examples

This document shows how to add tooltips to existing components for contextual help.

## Basic Import

```jsx
import { IconWithTooltip } from '../components/Tooltip';
```

## Usage Examples

### 1. Import Instructions (Event Subscriptions Tab)

**Add near import/bulk action buttons:**

```jsx
// In EventSubscriptionsTab.jsx - Add to button section
<div className="flex items-center gap-2">
  <button onClick={handleImport} className="...">
    <Icon path={mdiFileImport} size={0.9} />
    Import Data
  </button>
  <IconWithTooltip 
    content="Import subscriptions from Excel/CSV. You'll need a JWT token from DevTools. See Help panel for detailed instructions."
    position="bottom"
  />
</div>
```

### 2. Companies Tab - Add Company Button

```jsx
// In CompaniesTab.jsx - Add near "Add Company" button
<div className="flex items-center gap-2">
  <button onClick={() => setIsAdding(true)} className="...">
    <Icon path={mdiPlus} size={0.9} />
    Add Company
  </button>
  <IconWithTooltip 
    content="Add a new exhibitor company. Company names must be unique. Contact info becomes the default for subscriptions."
    position="bottom"
  />
</div>
```

### 3. Assignments Tab - Linking Companies to Markers

```jsx
// In AssignmentsTab.jsx - Add near "Assign to Map" button
<div className="flex items-center gap-2">
  <button onClick={handleAssign} className="...">
    <Icon path={mdiMapMarkerPlus} size={0.9} />
    Assign to Map
  </button>
  <IconWithTooltip 
    content="Link a company subscription to a specific map marker (booth location). Each marker can only be assigned once per year."
    position="bottom"
  />
</div>
```

### 4. Map Management - Lock Marker Feature

```jsx
// In MapManagement.jsx - Add near lock toggle
<div className="flex items-center gap-2">
  <label className="flex items-center gap-2">
    <input type="checkbox" checked={marker.locked} onChange={handleLockToggle} />
    <span>Lock Marker</span>
  </label>
  <IconWithTooltip 
    content="Prevent accidental moves. Lock all markers before event day to avoid changes during live event."
    position="right"
  />
</div>
```

### 5. Marker Zoom Visibility

```jsx
// In marker edit form - Add near min/max zoom inputs
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <label>Min Zoom Level</label>
    <IconWithTooltip 
      content="Marker appears at this zoom level and higher. Use to control visual clutter on map."
      position="top"
    />
  </div>
  <input type="number" value={minZoom} onChange={handleChange} />
</div>
```

### 6. Year Selector in AdminLayout

**Already implemented in AdminLayout, but here's the pattern:**

```jsx
// Near year selector dropdown
<div className="flex items-center gap-2">
  <label>Event Year</label>
  <IconWithTooltip 
    content="Switch between event years. All data (subscriptions, assignments) is year-specific."
    position="top"
  />
</div>
```

### 7. Meal Counts in Subscriptions

```jsx
// In subscription edit form - Add to meal count sections
<div className="grid grid-cols-2 gap-4">
  <div>
    <div className="flex items-center gap-2 mb-1">
      <label>Breakfast (Sat)</label>
      <IconWithTooltip 
        content="Number of breakfast meals needed for Saturday"
        position="top"
      />
    </div>
    <input type="number" value={breakfastSat} onChange={handleChange} />
  </div>
  <div>
    <div className="flex items-center gap-2 mb-1">
      <label>Lunch (Sat)</label>
      <IconWithTooltip 
        content="Number of lunch meals needed for Saturday"
        position="top"
      />
    </div>
    <input type="number" value={lunchSat} onChange={handleChange} />
  </div>
</div>
```

### 8. Booth Count vs Assignments

```jsx
// In subscriptions tab - Add near booth count field
<div className="flex items-center gap-2">
  <label>Booth Count</label>
  <IconWithTooltip 
    content="Total booths requested by company. May differ from actual assignments. Use Assignments tab to link specific map locations."
    position="top"
  />
</div>
```

### 9. Map Layer Switcher

```jsx
// In map controls - Add near layer switcher
<div className="flex items-center gap-2">
  <button onClick={toggleLayers}>
    <Icon path={mdiLayers} size={1} />
  </button>
  <IconWithTooltip 
    content="Switch between Satellite and Street map views. Default can be set in Settings."
    position="left"
  />
</div>
```

### 10. Settings - Organization Logo Upload

```jsx
// In settings/branding - Add near logo uploader
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <h3>Organization Logo</h3>
    <IconWithTooltip 
      content="Upload your organization logo. Appears on map cluster markers and admin header. Recommended size: 200x200px, transparent PNG."
      position="right"
    />
  </div>
  <LogoUploader />
</div>
```

## Advanced: Custom Tooltip Trigger

For complex UI elements, use the base Tooltip component with custom trigger:

```jsx
import Tooltip from '../components/Tooltip';

<Tooltip content="Custom help text" position="bottom" trigger="click">
  <button className="custom-button">
    Complex Action
  </button>
</Tooltip>
```

## Priority Tooltips to Add First

1. ✅ **Import Data** buttons (most confusing for new users)
2. ✅ **JWT Token** instructions (technical requirement)
3. ✅ **Lock Markers** (prevent event-day accidents)
4. ✅ **Booth Count vs Assignments** (common confusion)
5. ✅ **Min/Max Zoom** (not intuitive)
6. ✅ **Year Selector** (data scope clarification)
7. ⏰ Meal counts (nice-to-have)
8. ⏰ Logo upload (nice-to-have)
9. ⏰ Map layers (self-explanatory)
10. ⏰ Other form fields (low priority)

## Implementation Checklist

- [ ] Add IconWithTooltip to EventSubscriptionsTab (import button)
- [ ] Add IconWithTooltip to CompaniesTab (add company button)
- [ ] Add IconWithTooltip to AssignmentsTab (assign button)
- [ ] Add IconWithTooltip to MapManagement (lock toggle)
- [ ] Add IconWithTooltip to marker zoom controls
- [ ] Add IconWithTooltip to booth count field
- [ ] Add IconWithTooltip to meal count fields
- [ ] Test all tooltips on mobile (touch interaction)
- [ ] Verify keyboard accessibility (focus + enter)

## Testing

1. **Hover test**: Tooltip appears on hover
2. **Focus test**: Tooltip appears on keyboard focus (Tab)
3. **Mobile test**: Tooltip appears on tap (click trigger)
4. **Position test**: Tooltip doesn't overflow screen edges
5. **Content test**: Text is clear and concise

## Style Consistency

All tooltips should:
- Use `position="top"` or `"bottom"` for primary actions
- Use `position="right"` or `"left"` for form fields
- Keep content under 150 characters
- Use plain language, not technical jargon
- Provide actionable guidance

---

**Note:** You can add tooltips incrementally. Start with high-priority items and expand based on user feedback and common support questions.
