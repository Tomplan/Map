# Category System Implementation Plan

## Overview
Multi-category system for 4x4 Vakantiebeurs exhibitors with full localization (NL/EN/DE).

## Database Schema ✅ COMPLETED
- `categories` table with slug, icon, color, sort_order
- `category_translations` table for localized names/descriptions  
- `company_categories` junction table (many-to-many)
- RLS policies: public read, admin write
- Initial 10 categories seeded with translations

## Categories Defined
1. **Voertuigen & Dealers** (Vehicles & Dealers) - Blue #1976d2
2. **Kampeermiddelen & Trailers** (Camping Equipment) - Green #2e7d32
3. **Aanhangwagens & Uitrusting** (Trailers & Towing) - Orange #f57c00
4. **Onderdelen & Accessoires** (Parts & Accessories) - Purple #5e35b1
5. **Reisorganisaties & Tours** (Travel Organizations) - Teal #00897b
6. **Accommodaties** (Accommodations) - Red #c62828
7. **Clubs & Gemeenschappen** (Clubs & Communities) - Brown #6d4c41
8. **Terrein & Offroad Ervaringen** (Offroad Experiences) - Deep Orange #d84315
9. **Elektronica & Communicatie** (Electronics) - Blue Grey #455a64
10. **Overig** (Other) - Grey #757575

## React Hook ✅ COMPLETED
`src/hooks/useCategories.js` provides:
- `categories` - array with localized names
- `loading`, `error` states
- `createCategory`, `updateCategory`, `deleteCategory`
- `getCompanyCategories`, `assignCategoriesToCompany`
- `getCategoryStats` - exhibitor count per category
- Real-time subscription to changes

## UI Components - IN PROGRESS

### ExhibitorListView Enhancements
- [ ] Import useCategories hook
- [ ] Add selectedCategories state
- [ ] Horizontal scrolling category chips (mobile-first)
- [ ] Category filter logic in filteredExhibitors
- [ ] Clear all filters button
- [ ] Empty state when no matches
- [ ] Category badges on exhibitor cards
- [ ] Show exhibitor count on category chips

### Admin Category Management
- [ ] Create CategoryManagement.jsx component
- [ ] CRUD interface for categories
- [ ] Multi-language form (NL/EN/DE tabs)
- [ ] Icon picker (Material Design Icons)
- [ ] Color picker
- [ ] Drag-and-drop sort order
- [ ] Add to AdminLayout navigation

### Admin Company Assignment
- [ ] Add category multi-select to company edit modal
- [ ] Bulk assignment tool
- [ ] Visual category badges in company list
- [ ] Category filter in assignments tab

## Localization Keys Needed
```json
{
  "exhibitorPage": {
    "categories": "Categorieën",
    "allCategories": "Alle categorieën",
    "clearFilters": "Wis filters",
    "noCategoryMatch": "Geen exposanten gevonden in deze categorieën",
    "categoriesSelected": "{{count}} categorie geselecteerd",
    "categoriesSelected_plural": "{{count}} categorieën geselecteerd"
  },
  "admin": {
    "categories": {
      "title": "Categorieën Beheer",
      "add": "Categorie Toevoegen",
      "edit": "Categorie Bewerken",
      "delete": "Verwijderen",
      "slug": "Slug",
      "icon": "Icoon",
      "color": "Kleur",
      "sortOrder": "Volgorde",
      "translations": "Vertalingen",
      "exhibitorCount": "{{count}} exposant",
      "exhibitorCount_plural": "{{count}} exposanten"
    }
  }
}
```

## Migration Instructions
1. Run migration: `007_create_categories_system.sql` in Supabase SQL editor
2. Verify tables created successfully
3. Test RLS policies work correctly
4. Confirm initial 10 categories seeded

## Phase Rollout
- **Phase 1**: Database + Hook ✅
- **Phase 2**: User filtering UI (next)
- **Phase 3**: Admin management UI
- **Phase 4**: Bulk assignment + analytics

## Testing Checklist
- [ ] Categories load with correct translations
- [ ] Filter updates exhibitor list correctly
- [ ] Multiple category selection works
- [ ] Clear filters resets to all exhibitors
- [ ] Category badges display on cards
- [ ] Real-time updates when categories change
- [ ] Mobile responsive (horizontal scroll)
- [ ] Accessibility (keyboard nav, ARIA labels)
- [ ] Performance with 80+ exhibitors
- [ ] Admin can assign/remove categories
- [ ] Bulk operations work correctly

## Future Enhancements
- Category-based search autocomplete
- "Related exhibitors" based on shared categories
- Category analytics dashboard for organizers
- Export exhibitor list by category (CSV/PDF)
- Public API endpoint for category-filtered exhibitors
- Category-based email campaigns
