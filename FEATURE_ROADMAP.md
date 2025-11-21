# Feature Roadmap: One-Day Event App Enhancements

**Event:** 4x4 Vakantiebeurs
**App Type:** One-day event webapp (used only on event day)
**Current State:** Interactive map with exhibitor markers, admin dashboard for management

---

## Current Features ✅

- Interactive map with booth markers (blue = assigned, grey = unassigned)
- Exhibitor data: logo, name, booth number, website, info
- Mobile bottom sheet for marker details
- Desktop tooltips and popups
- Admin dashboard (Companies, Subscriptions, Assignments tabs)
- Multi-year event support
- Right-click context menu for booth assignment (admin)
- Real-time updates via Supabase subscriptions
- Multi-language support (English, German - planned)
- Offline status indicator
- Accessibility toggle

---

## Phase 1: Navigation & Structure

### 1.1 Bottom Tab Navigation (Mobile-First)
**Goal:** Create primary navigation for visitor experience

**Tabs:**
- 🏠 **Home** - Landing page
- 🗺️ **Map** - Current EventMap component
- 📋 **Exhibitors** - List view
- 📅 **Schedule** - Event timeline

**Files to create:**
- `src/components/TabNavigation.jsx` - Bottom tab bar component
- `src/components/HomePage.jsx` - Landing screen
- `src/components/ExhibitorListView.jsx` - Exhibitor list
- `src/components/EventSchedule.jsx` - Schedule view

**Files to modify:**
- `src/components/AppRoutes.jsx` - Add new routes for tabs
- `src/App.jsx` - Update routing structure if needed

**Design Considerations:**
- Fixed bottom position on mobile
- Horizontal tabs on desktop/tablet
- Active state highlighting
- Icon + label for each tab

---

## Phase 2: Homescreen/Landing Page

### 2.1 HomePage Component
**Goal:** Welcome visitors and provide event overview

**Content:**
- **Welcome banner**: Event name + logo (from Organization_Profile)
- **Quick stats**:
  - "X Exhibitors"
  - "[Date]"
  - "[Location]"
- **Event info card**:
  - Opening hours (e.g., "Open: 10:00 - 18:00")
  - Parking information
  - WiFi credentials
  - Facility info (toilets, food, etc.)
- **Large CTA button**: "View Map" or "Explore Exhibitors"
- **Upcoming activity**: Show next scheduled event if within 30 minutes

**Data Sources:**
- Event metadata → New table `Event_Info` or extend `Organization_Profile`
- Exhibitor count → Calculate from `Event_Subscriptions` filtered by year
- Next activity → Query `Event_Schedule` table (Phase 6)

**Database Addition Needed:**
```sql
-- Option A: Extend Organization_Profile
ALTER TABLE Organization_Profile
ADD COLUMN event_date DATE,
ADD COLUMN event_hours TEXT,
ADD COLUMN parking_info TEXT,
ADD COLUMN wifi_password TEXT,
ADD COLUMN facilities_info TEXT;

-- Option B: Create separate Event_Info table
CREATE TABLE Event_Info (
  id SERIAL PRIMARY KEY,
  year INTEGER UNIQUE NOT NULL,
  event_date DATE NOT NULL,
  event_hours TEXT,
  location TEXT,
  parking_info TEXT,
  wifi_password TEXT,
  facilities_info TEXT,
  welcome_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Files to create:**
- `src/components/HomePage.jsx`
- `src/hooks/useEventInfo.js` - Fetch event metadata
- Admin tab: `src/components/admin/EventInfoTab.jsx` - Edit event info

---

## Phase 3: Exhibitor List View

### 3.1 ExhibitorListView Component
**Goal:** Alternative view to browse all exhibitors

**Layout:**
- **Search bar** at top (search by company name)
- **Filter section**:
  - Category chips (horizontal scroll)
  - "Favorites Only" toggle switch
- **Scrollable list** of exhibitor cards

**Exhibitor Card Display:**
- Company logo (80x80px, square)
- Company name (bold, 16px)
- Booth number badge (e.g., "A12" in colored pill)
- Category tag (e.g., "Vehicles & Parts")
- Favorite star icon (⭐ yellow when active, ☆ grey when inactive)

**Interactions:**
- **Tap exhibitor card** → Navigate to Map tab
- **Auto-focus** on selected marker
- **Auto-open** popup/bottom sheet for that exhibitor
- **Tap favorite star** → Toggle favorite (no navigation)

**Sorting Options:**
- Alphabetical (A-Z)
- By booth number
- Favorites first

**Data Source:**
- Reuse `useEventMarkers_v2` hook (existing)
- Add filtering logic for categories and favorites

**Files to create:**
- `src/components/ExhibitorListView.jsx`
- `src/components/ExhibitorCard.jsx` - Individual list item
- `src/hooks/useExhibitorFilter.js` - Filter logic (categories, favorites, search)

**Files to modify:**
- `src/components/EventMap/EventMap.jsx` - Accept `focusedMarkerId` prop to auto-focus
- `src/components/EventClusterMarkers.jsx` - Auto-open popup when focused

---

## Phase 4: Favorites System

### 4.1 Favorite Functionality
**Goal:** Let visitors mark exhibitors to remember/visit

**Storage Strategy:**
- **LocalStorage** (no login required)
- Key: `event_favorites_[year]`
- Value: Array of company IDs
- Example: `["company-123", "company-456"]`

**UI Changes:**

**1. List View:**
- Star icon next to each exhibitor
- Tap to toggle favorite
- Visual feedback (animation)

**2. Map View:**
- Use **different marker icon** for favorited exhibitors
- Options:
  - Yellow star marker (`glyph-marker-icon-favorite.svg`)
  - Gold/yellow tint on existing blue marker
  - Border/outline effect
- Keep company-assigned logic (blue = assigned, grey = unassigned)
- Priority: Favorite style > Assignment style

**3. Marker Popup (Desktop):**
- Add favorite button/icon at top-right
- Toggle on click

**4. Mobile Bottom Sheet:**
- Add favorite button/icon at top-right
- Toggle on click

**5. Filter Option:**
- "Show Favorites Only" toggle in list view
- "Show Favorites Only" toggle in map view (hides non-favorite markers)

**Marker Icon Priority:**
```javascript
// Pseudocode
if (isFavorite) {
  iconUrl = 'glyph-marker-icon-favorite.svg'; // Yellow star
} else if (hasCompanyAssignment) {
  iconUrl = 'glyph-marker-icon-blue.svg'; // Blue
} else {
  iconUrl = 'glyph-marker-icon-gray.svg'; // Grey
}
```

**Files to create:**
- `src/hooks/useFavorites.js` - Manage favorites state
- `src/components/FavoriteButton.jsx` - Reusable favorite toggle button
- `public/assets/icons/glyph-marker-icon-favorite.svg` - Yellow star marker icon

**Files to modify:**
- `src/hooks/useEventMarkers_v2.js` - Integrate favorite icon logic
- `src/components/EventClusterMarkers.jsx` - Use favorite markers
- `src/components/MarkerDetailsUI.jsx` - Add favorite button to popup
- `src/components/MobileBottomSheet.jsx` - Add favorite button to sheet
- `src/components/ExhibitorListView.jsx` - Show favorite status

**useFavorites Hook API:**
```javascript
const {
  favorites,           // Array of company IDs
  isFavorite,          // (companyId) => boolean
  toggleFavorite,      // (companyId) => void
  addFavorite,         // (companyId) => void
  removeFavorite,      // (companyId) => void
  clearAllFavorites    // () => void
} = useFavorites(selectedYear);
```

---

## Phase 5: Category System

### 5.1 Database Changes
**Goal:** Organize exhibitors by category

**Database Migration:**
```sql
-- Add category column to Companies table
ALTER TABLE Companies ADD COLUMN category TEXT;

-- Optional: Create categories table for consistency
CREATE TABLE Categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT, -- Optional: emoji or icon name
  color TEXT, -- Optional: hex color for badges
  display_order INTEGER DEFAULT 0
);

-- If using categories table, update Companies
ALTER TABLE Companies
ADD COLUMN category_id INTEGER REFERENCES Categories(id);
```

**Suggested Categories for 4x4 Event:**
- 🚙 Vehicles & Parts
- 🌍 Travel Agencies
- ⛺ Camping Equipment
- 💼 Insurance & Finance
- 🛠️ Accessories & Gear
- 🍔 Food & Beverage
- 📸 Photography & Media
- 🏕️ Outdoor Clothing
- 🗺️ Navigation & Tech
- Other

### 5.2 Category Filter UI

**Filter Component:**
- **Horizontal scrollable chips** (mobile)
- **Multi-select dropdown** (desktop alternative)
- **"All Categories" default** state
- **Active state styling** for selected categories
- **Badge count**: "Showing 15 of 67 exhibitors"

**Filter Logic:**
- Select multiple categories (OR logic: show exhibitors matching ANY selected category)
- Combine with search and favorites filter (AND logic)
- Real-time filtering (no "Apply" button needed)

**UI Placement:**
- Above exhibitor list
- Collapsible drawer on map view (filter icon in top-right)

### 5.3 Admin Changes

**CompaniesTab:**
- Add "Category" dropdown field in edit mode
- Populate from Categories table or hardcoded list
- Show category in table column

**Files to create:**
- `src/components/CategoryFilter.jsx` - Filter UI component
- `src/hooks/useCategories.js` - Fetch categories
- Admin tab: `src/components/admin/CategoriesTab.jsx` - Manage category list (if using table)

**Files to modify:**
- `src/components/admin/CompaniesTab.jsx` - Add category field
- `src/components/ExhibitorListView.jsx` - Add category filter
- `src/components/ExhibitorCard.jsx` - Display category badge
- `src/components/EventMap/EventMap.jsx` - Add category filter option
- `src/components/MarkerDetailsUI.jsx` - Show category in popup
- `src/components/MobileBottomSheet.jsx` - Show category in sheet

---

## Phase 6: Live Event Schedule

### 6.1 Database Table
**Goal:** Display timetable of activities during the event

**Database Schema:**
```sql
CREATE TABLE Event_Schedule (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location TEXT, -- e.g., "Arena A", "Main Stage"
  marker_id INTEGER REFERENCES Markers(id), -- Optional: link to map location
  category TEXT, -- e.g., "Demo", "Workshop", "Performance"
  is_highlighted BOOLEAN DEFAULT FALSE, -- Featured activity
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example data
INSERT INTO Event_Schedule (year, title, description, start_time, end_time, location, category) VALUES
(2026, 'RC Car Demonstrations', 'Watch professional RC drivers perform stunts', '2026-10-10 10:00:00', '2026-10-10 11:30:00', 'RC Arena', 'Demo'),
(2026, 'Flight Demonstrations', 'Drone and aircraft flight shows', '2026-10-10 12:00:00', '2026-10-10 13:00:00', 'Outdoor Field', 'Demo'),
(2026, '4x4 Off-Road Workshop', 'Learn advanced off-road driving techniques', '2026-10-10 14:00:00', '2026-10-10 15:30:00', 'Workshop Tent', 'Workshop');
```

### 6.2 Schedule View Component

**Layout:**
- **Timeline format** (vertical list)
- **Current time indicator** (red line or highlight)
- **Activity cards** showing:
  - Time range (10:00 - 11:00)
  - Title (bold)
  - Location (with map pin icon)
  - Category badge
  - Brief description

**Visual States:**
- **Upcoming** (next 30 mins): Highlighted with accent color
- **Current** (happening now): Strong highlight + "LIVE" badge
- **Past**: Greyed out, collapsed by default
- **Featured**: Special border or background color

**Interactions:**
- **Tap location** → Navigate to Map tab and focus on `marker_id` (if linked)
- **Expand card** → Show full description
- **"Add Reminder" button** (optional, uses browser notifications)

**Files to create:**
- `src/components/EventSchedule.jsx` - Schedule view
- `src/components/ScheduleActivityCard.jsx` - Individual activity item
- `src/hooks/useEventSchedule.js` - Fetch schedule data
- Admin tab: `src/components/admin/ScheduleTab.jsx` - CRUD for schedule

**useEventSchedule Hook:**
```javascript
const {
  allActivities,      // All schedule items for the day
  upcomingActivities, // Next 3 activities
  currentActivity,    // Activity happening right now
  pastActivities,     // Completed activities
  loading,
  error
} = useEventSchedule(selectedYear);
```

**Admin Features (ScheduleTab):**
- Add/Edit/Delete schedule items
- Drag-and-drop reordering
- Link to map marker (dropdown of special markers)
- Mark as "featured"
- Bulk import from CSV

---

## Phase 7: Real-time Visitor Count (Admin Only)

### 7.1 Analytics Tracking
**Goal:** Show current visitor count in admin dashboard

**Tracking Strategy:**
- Generate unique session ID on first visit
- Store in localStorage: `visitor_session_id`
- Send to database with timestamp
- Count unique sessions in last 4 hours as "active visitors"

**Database Schema:**
```sql
CREATE TABLE Visitor_Analytics (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  session_id UUID UNIQUE NOT NULL,
  first_visit TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  page_views INTEGER DEFAULT 1,
  user_agent TEXT,
  referrer TEXT
);

-- Index for performance
CREATE INDEX idx_visitor_year_activity ON Visitor_Analytics(year, last_activity);
```

**Tracking Logic:**
```javascript
// On app load (visitor side)
1. Check localStorage for session_id
2. If not exists:
   - Generate UUID
   - Store in localStorage
   - Insert new row in Visitor_Analytics
3. If exists:
   - Update last_activity timestamp
   - Increment page_views

// Admin dashboard (real-time count)
1. Query Visitor_Analytics
2. Filter: year = current year AND last_activity > NOW() - 4 hours
3. Count distinct session_ids
4. Auto-refresh every 30 seconds
```

### 7.2 Admin Dashboard Widget

**Display:**
- **Card in AdminDashboard.jsx**
- **Title:** "Visitor Analytics"
- **Main metric:** "🔴 45 Visitors Active Now"
- **Secondary stats:**
  - "128 Total Visits Today"
  - "📊 Peak: 67 at 14:30"
- **Last updated timestamp**
- **Auto-refresh indicator** (spinning icon)

**Optional Enhancements:**
- Simple line chart showing visitor count over time (last 6 hours)
- Breakdown by hour
- Export data as CSV

**Files to create:**
- `src/hooks/useVisitorTracking.js` - Track visitor session
- `src/hooks/useVisitorAnalytics.js` - Fetch analytics data (admin)
- `src/components/admin/VisitorAnalyticsWidget.jsx` - Dashboard widget

**Files to modify:**
- `src/components/AdminDashboard.jsx` - Add analytics widget
- `src/App.jsx` - Initialize visitor tracking on mount

**Privacy Considerations:**
- No personal data collected
- Only anonymous session tracking
- No cookies (localStorage only)
- Compliant with privacy regulations

---

## Phase 8: Design System Discussion

**Current State:**
- **Primary color:** Orange (#ff6800) - from website
- **Typography:** Arvo font (serif) - from website
- **UI Framework:** Tailwind CSS utility classes
- **Icons:** @mdi/react (Material Design Icons)
- **Components:** Ad-hoc styling, no design system
- **Spacing:** Inconsistent (mix of px values)

### Questions for Discussion:

#### 1. Color Palette
**Current:**
- Primary: Orange (#ff6800)
- Map markers: Blue (assigned), Grey (unassigned)
- Admin sections: Blue-50 (public), Green-50 (manager)

**Proposal:**
Should we define a complete palette?
- Primary (orange)
- Secondary (for accents, CTAs)
- Success, Warning, Error states
- Neutral greys (100-900)
- Category colors (if using color-coded categories)

#### 2. Typography
**Current:**
- Arvo (serif) for headers/branding
- Sans-serif fallback for body

**Proposal:**
- Keep Arvo for event branding consistency with website
- Add modern sans-serif (Inter, Open Sans) for UI text?
- Define type scale (h1, h2, h3, body, small)

#### 3. Spacing System
**Current:** Inconsistent padding/margins

**Proposal:** Standardize on 4px base unit
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

#### 4. Component Library
**Current:** Custom components with inline Tailwind classes

**Proposal:** Create reusable components
- `<Button variant="primary|secondary|outline" size="sm|md|lg" />`
- `<Card elevated={true} />`
- `<Badge color="blue|green|orange" />`
- `<Input label="..." error="..." />`
- `<Chip active={true} onToggle={() => {}} />`

#### 5. Icon System
**Current:** @mdi/react icons, various sizes

**Proposal:**
- Standardize icon sizes (16px, 20px, 24px)
- Create icon wrapper component for consistency
- Define icon color palette (matches text colors)

#### 6. Dark Mode
**Question:** Do you want dark mode support?
- Event runs during daytime: probably not needed
- Could add for evening events or user preference

#### 7. Branding Consistency
**Current:** App uses some website elements (logo, orange color, Arvo font)

**Proposal:**
- Match website's visual style more closely?
- Keep app minimal/functional vs. marketing-heavy?
- Use same button styles, card shadows, etc.?

#### 8. Mobile-First Design
**Current:** Mostly responsive

**Proposal:**
- Design all new components mobile-first
- Touch targets minimum 44px
- Bottom navigation (easier thumb access)
- Swipe gestures where appropriate

---

## Implementation Priority

### 🔴 High Priority (Core Visitor Features)
**Goal:** Essential features for event day

1. **Tab Navigation** (Phase 1)
   - Enables navigation between views
   - Foundation for all other features
   - Effort: Small
   - Impact: High

2. **HomePage** (Phase 2)
   - First impression for visitors
   - Provides essential event info
   - Effort: Small-Medium
   - Impact: High

3. **Exhibitor List View** (Phase 3)
   - Alternative to map-only browsing
   - Easier to find specific exhibitors
   - Effort: Medium
   - Impact: High

4. **Favorites System** (Phase 4)
   - High user value (remember exhibitors to visit)
   - Differentiates from static maps
   - Effort: Medium
   - Impact: High

### 🟡 Medium Priority (Enhanced Experience)
**Goal:** Nice-to-have features that improve UX

5. **Category Filtering** (Phase 5)
   - Helps visitors find relevant exhibitors
   - Requires database changes
   - Effort: Medium
   - Impact: Medium-High

6. **Event Schedule** (Phase 6)
   - Useful if event has activities/demos
   - Requires new database table + admin UI
   - Effort: Medium-Large
   - Impact: Medium (depends on event complexity)

### 🟢 Low Priority (Admin/Analytics)
**Goal:** Tools for organizers, not critical for visitors

7. **Visitor Analytics** (Phase 7)
   - Admin-only feature
   - Nice to have but not essential
   - Effort: Medium
   - Impact: Low (for visitors), Medium (for admins)

### 🔵 Ongoing
8. **Design System** (Phase 8)
   - Should be integrated throughout all phases
   - Refine as features are built
   - Effort: Medium (initial setup), Ongoing
   - Impact: High (consistency, maintainability)

---

## Database Schema Summary

### New Tables Required:

#### 1. Event_Info (Phase 2)
```sql
CREATE TABLE Event_Info (
  id SERIAL PRIMARY KEY,
  year INTEGER UNIQUE NOT NULL,
  event_date DATE NOT NULL,
  event_hours TEXT,
  location TEXT,
  parking_info TEXT,
  wifi_password TEXT,
  facilities_info TEXT,
  welcome_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Categories (Phase 5 - Optional)
```sql
CREATE TABLE Categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0
);
```

#### 3. Event_Schedule (Phase 6)
```sql
CREATE TABLE Event_Schedule (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location TEXT,
  marker_id INTEGER REFERENCES Markers(id),
  category TEXT,
  is_highlighted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Visitor_Analytics (Phase 7)
```sql
CREATE TABLE Visitor_Analytics (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  session_id UUID UNIQUE NOT NULL,
  first_visit TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  page_views INTEGER DEFAULT 1,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_visitor_year_activity ON Visitor_Analytics(year, last_activity);
```

### Modified Tables:

#### Companies (Phase 5)
```sql
ALTER TABLE Companies ADD COLUMN category TEXT;
-- OR
ALTER TABLE Companies ADD COLUMN category_id INTEGER REFERENCES Categories(id);
```

---

## Technical Decisions Needed

### 1. Routing Strategy
**Current:** React Router with HashRouter (for GitHub Pages)

**Options for tabs:**
- **Option A:** Keep single route `/`, use component state for tab switching
  - Pros: Simpler, no route changes
  - Cons: Can't bookmark specific tabs, no browser back button support

- **Option B:** Add routes `/map`, `/list`, `/schedule`
  - Pros: Bookmarkable, browser navigation works
  - Cons: More complex routing

**Recommendation:** Option B (better UX)

### 2. State Management
**Current:** React hooks (useState, useEffect), Supabase real-time

**For new features:**
- **Favorites:** localStorage + React Context
- **Filters:** URL query params + local state
- **Analytics:** Supabase real-time subscriptions

**Decision:** Continue with hooks + Context, no need for Redux/Zustand yet

### 3. Offline Support
**Current:** Basic offline indicator

**Enhancement:**
- Cache exhibitor data in IndexedDB for offline access
- Service Worker for asset caching
- Show "Offline Mode" banner with cached data

**Decision:** Implement in Phase 1 if internet connectivity at venue is poor

### 4. Performance Optimization
**Concerns:**
- Large marker count (67+ exhibitors)
- Real-time updates

**Optimizations:**
- Marker clustering (already exists)
- Virtual scrolling for exhibitor list (react-window)
- Debounce search/filter inputs
- Lazy load images in list view
- Memoize expensive calculations

### 5. Testing Strategy
**Current:** No automated tests

**Proposal:**
- Unit tests for hooks (useFavorites, useEventSchedule)
- Integration tests for key user flows
- Manual testing on multiple devices

**Decision:** Add testing incrementally, focus on critical paths

---

## Next Steps

1. **Review this roadmap** - Confirm priorities and scope
2. **Discuss Design System** - Make decisions on branding/styling
3. **Start Phase 1** - Implement tab navigation structure
4. **Iterative development** - Build, test, deploy incrementally

---

**Last Updated:** 2025-11-17
**Status:** Planning Phase
**Version:** 1.0
