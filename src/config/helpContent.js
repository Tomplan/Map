/**
 * Help Content Configuration
 * 
 * Bilingual help content for each admin page (EN/NL).
 * No versioning - uses simple date-based updates.
 * 
 * Structure:
 * - title: { en, nl } - Page/section title
 * - content: { en, nl } - Main help text (supports markdown-style formatting)
 * - updated: Last update date (YYYY-MM-DD)
 * - tips: { en: [], nl: [] } - Quick tips arrays
 */

export const helpContent = {
  // Dashboard Help
  dashboard: {
    title: "Dashboard Overview",
    content: `
The dashboard provides a quick overview of your event data:

**Key Metrics:**
- **Total Markers**: All map locations (booths, parking, facilities)
- **Companies**: Registered exhibitor companies
- **Subscriptions**: Companies registered for the selected year
- **Assignments**: Companies assigned to map locations

**Event Stats:**
- View meal counts (breakfast, lunch, BBQ) for Saturday and Sunday
- Track total coins distributed
- All stats update in real-time as you make changes

**Year Selector:**
Use the year dropdown in the top navigation to switch between event years.
    `.trim(),
    updated: "2025-11-21",
    tips: [
      "Use the year selector to view past or future events",
      "Stats update automatically when you make changes",
      "Dashboard is read-only - go to specific tabs to edit data"
    ]
  },

  // Map Management Help
  mapManagement: {
    title: "Map Management",
    content: `
The Map Management page lets you place and configure map markers.

**Placing Markers:**
1. Click "Add Marker" or right-click on the map
2. Drag the marker to the desired position
3. Set marker properties (name, type, icon, visibility)
4. Click "Save" to persist changes

**Marker Properties:**
- **Type**: Booth, Parking, Food, Event, etc.
- **Icon & Color**: Visual appearance on map
- **Min/Max Zoom**: Control when marker appears based on zoom level
- **Rotation**: Adjust booth rectangle angle (booths only)
- **Lock**: Prevent accidental moves during event

**Tips:**
- Lock markers before event day to prevent accidental changes
- Use zoom visibility to keep map clean at different zoom levels
- Rectangles (6m x 6m) show booth outlines - only visible in admin view
    `.trim(),
    updated: "2025-11-21",
    tips: [
      "Right-click on map for quick marker creation",
      "Lock markers before going live to prevent accidents",
      "Adjust min/max zoom to control marker visibility",
      "Use rectangles to visualize booth layouts"
    ]
  },

  // Companies Help
  companies: {
    title: "Companies Management",
    content: `
Manage exhibitor companies and their contact information.

**Adding Companies:**
1. Click "Add Company" button
2. Fill in company details (name, contact, phone, email)
3. Click "Save"

**Company Information:**
- **Company Name**: Primary identifier (must be unique)
- **Contact Person**: Main point of contact
- **Phone**: Contact phone number
- **Email**: Contact email address

**Editing Companies:**
- Click on any row to edit company details
- Changes save automatically
- Company data persists across event years

**Importing Companies:**
See the import section for bulk company uploads via CSV/Excel.
    `.trim(),
    updated: "2025-11-21",
    tips: [
      "Company names must be unique",
      "Contact info becomes default for new subscriptions",
      "Use import feature for bulk company additions",
      "Companies persist across years - no need to re-add"
    ]
  },

  // Subscriptions Help
  subscriptions: {
    title: "Event Subscriptions",
    content: `
Track which companies are participating in each event year.

**What is a Subscription?**
A subscription represents a company's participation in a specific event year, including:
- Booth allocation count
- Meal orders (breakfast, lunch, BBQ for Sat/Sun)
- Coin distribution
- Internal notes

**Creating Subscriptions:**
1. Select event year from dropdown
2. Click "Add Subscription"
3. Select company from list
4. Enter booth count and meal numbers
5. Save

**Importing Subscriptions:**
Use the import feature to bulk-upload subscription data from Excel/CSV.
See "Import Guide" for detailed instructions.

**Important:**
- Each company can only have one subscription per year
- Meal counts and coins are used for event planning
- Notes field is for internal use only (not visible to exhibitors)
    `.trim(),
    updated: "2025-11-21",
    tips: [
      "One subscription per company per year",
      "Import Excel file to save time on bulk data entry",
      "Use notes field for internal tracking",
      "Meal counts help with catering planning"
    ]
  },

  // Assignments Help
  assignments: {
    title: "Map Assignments",
    content: `
Link companies to their map locations (markers).

**What is an Assignment?**
An assignment connects a company's subscription to a specific map marker (booth location).

**Creating Assignments:**
1. Select event year
2. Click "Assign to Map"
3. Choose company subscription
4. Select map marker (booth location)
5. Save assignment

**Assignment Rules:**
- Company must have a subscription for that year
- Each marker can only be assigned to one company per year
- Assignments are year-specific (2025 assignments don't affect 2026)

**Viewing on Map:**
- Public map shows company name and logo at assigned marker
- Click marker to view company details
- Search function finds companies by name or booth number
    `.trim(),
    updated: "2025-11-21",
    tips: [
      "Company needs subscription before assignment",
      "One company per marker per year",
      "Assignments appear immediately on public map",
      "Use year selector to manage different event years"
    ]
  },

  // Import Guide
  import: {
    title: "Data Import Guide",
    content: `
Import company and subscription data from Excel/CSV files.

**Prerequisites:**
1. You need a valid JWT authentication token
2. Prepare your Excel file with required columns
3. Company names in Excel must match database company names

**Getting Your JWT Token:**
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Application** tab → **Local Storage**
3. Find \`supabase.auth.token\` key
4. Copy the \`access_token\` value (long string starting with "eyJ...")

**Running Import:**
\`\`\`bash
./run-import.sh 'YOUR_JWT_TOKEN_HERE'
\`\`\`

**Excel File Format:**
Required columns:
- **Bedrijfsnaam**: Company name (must match existing company)
- **Volledige naam**: Contact person
- **telefoon nr**: Phone number
- **e-mail**: Email address
- **Aantal kramen**: Booth count
- **Aantal munten**: Coins
- **Ontbijt za/zo**: Breakfast counts
- **Lunch za/zo**: Lunch counts
- **BBQ za**: BBQ count

**Troubleshooting:**
- "Company not found": Check company name spelling
- "JWT expired": Get a fresh token from DevTools
- "Column missing": Verify Excel file has all required columns

For detailed instructions, see \`IMPORT_README.md\` file.
    `.trim(),
    updated: "2025-11-21",
    tips: [
      "JWT tokens expire - get fresh token if import fails",
      "Company names must match exactly (case-insensitive)",
      "Test with small file first",
      "Backup data before large imports"
    ]
  },

  // Settings Help (Super Admin only)
  settings: {
    title: "System Settings",
    content: `
Configure system-wide settings and preferences.

**Available Settings:**
- **Organization Profile**: Logo, name, branding
- **Map Defaults**: Default layers, zoom levels
- **User Management**: Admin roles and permissions
- **Marker Defaults**: Default icons, colors, sizes
- **Event Defaults**: Saturday/Sunday meal options
- **Branding**: Colors, logo, organization name
- **Program Management**: Event schedule and activities

**Organization Logo:**
Upload your organization logo to appear:
- On map cluster markers
- In admin dashboard header
- In public map branding

**User Roles:**
- **Super Admin**: Full access to all features
- **System Manager**: Dashboard + Map Management
- **Event Manager**: Dashboard + Companies + Subscriptions + Assignments
- **Content Editor**: Program management access

**Important:**
Only Super Admins can access settings. Changes affect all users.
    `.trim(),
    updated: "2025-11-22",
    tips: [
      "Only Super Admins see this section",
      "Test logo uploads in staging first",
      "Changes affect all admin users",
      "Keep user count to 5-10 for best performance"
    ]
  },

  // Program Management Help
  programManagement: {
    title: "Program Management",
    content: `
Manage your event schedule and activities dynamically.

**Managing Activities:**
- **Add Activity**: Click "Add Activity" to create new schedule item
- **Edit**: Click pencil icon to modify existing activity
- **Delete**: Click trash icon with confirmation
- **Reorder**: Drag activities by the ⋮⋮ handle to change order

**Activity Properties:**
- **Title & Description**: Bilingual content (NL/EN)
- **Time**: Start and end time for the activity
- **Location Type**: 
  - **Exhibitor**: Links to company booth
  - **Venue**: Static location text
- **Badge**: Optional label (e.g., "FREE ENTRY!", "Members only")
- **Display Order**: Controls sort order in schedule
- **Active Status**: Hide/show activity from public view
- **Location Badge**: Optional exhibitor/venue indicator

**Day Tabs:**
Switch between Saturday and Sunday to manage each day separately.

**Tips:**
- Drag-to-reorder updates display_order automatically
- Exhibitor activities show company name
- Venue activities use custom location text
- Inactive activities hidden from public schedule
- Location badges help highlight special activities
    `.trim(),
    updated: "2025-11-22",
    tips: [
      "Drag activities to reorder them visually",
      "Link exhibitor activities to show booth locations",
      "Use badges to highlight special activities",
      "Set activities inactive to hide from public",
      "Location badges optional - usually not needed"
    ]
  },

  // General Tips
  general: {
    title: "Getting Started",
    content: `
Welcome to the Event Map Admin Panel!

**Your Role Determines Access:**
- **Super Admin**: Full access to everything
- **System Manager**: Map editing and dashboard
- **Event Manager**: Company and subscription management
- **Content Editor**: Program management access

**Common Workflows:**

**1. Setting Up a New Event Year:**
- Add/update companies in Companies tab
- Import subscriptions for new year
- Assign companies to map locations
- Update event schedule in Program Management

**2. Managing Map:**
- Place markers for booths, parking, facilities
- Adjust visibility by zoom level
- Lock markers before event goes live

**3. Managing Event Program:**
- Add/edit activities in Settings → Program Management
- Link exhibitor activities to company booths
- Drag-to-reorder for easy scheduling
- Set activities active/inactive to control visibility

**4. Day-of-Event:**
- Lock all markers to prevent accidents
- Monitor assignments in real-time
- Public map and schedule update automatically

**Need Help?**
- Hover over (?) icons for quick tips
- Check "What's New" for recent changes
- Contact system administrator for access issues
    `.trim(),
    updated: "2025-11-22",
    tips: [
      "Start with dashboard to understand current status",
      "Use year selector to switch between events",
      "Lock markers before going live",
      "Import data saves time vs manual entry",
      "Program management updates public schedule instantly"
    ]
  }
};

/**
 * Get help content for a specific page
 * @param {string} page - Page identifier (dashboard, mapManagement, etc.)
 * @param {string} language - Language code ('en' or 'nl')
 * @returns {object} Help content object with localized strings
 */
export function getHelpContent(page, language = 'en') {
  const content = helpContent[page] || helpContent.general;
  
  // Return localized version
  return {
    title: content.title?.[language] || content.title?.en || content.title,
    content: content.content?.[language] || content.content?.en || content.content,
    updated: content.updated,
    tips: content.tips?.[language] || content.tips?.en || content.tips
  };
}

/**
 * Get help content based on current route
 * @param {string} pathname - Current route pathname
 * @param {string} language - Language code ('en' or 'nl')
 * @returns {object} Help content object with localized strings
 */
export function getHelpContentByRoute(pathname, language = 'en') {
  const routeMap = {
    '/admin': 'dashboard',
    '/admin/map': 'mapManagement',
    '/admin/companies': 'companies',
    '/admin/subscriptions': 'subscriptions',
    '/admin/assignments': 'assignments',
    '/admin/settings': 'settings',
    '/admin/settings/program': 'programManagement',
  };

  const page = routeMap[pathname] || 'general';
  return getHelpContent(page, language);
}
