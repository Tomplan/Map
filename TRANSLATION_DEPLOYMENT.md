# Translation System - Deployment Checklist

## ✅ Completed Implementation

### Admin Interface (Managers)
- ✅ Multi-language Info field in CompaniesTab
- ✅ Language tabs (NL/EN) with visual indicators
- ✅ Auto-save on blur
- ✅ 🌐 indicator when multiple translations exist
- ✅ useCompanyTranslations hook for CRUD operations

### Public Interface (Normal Users)
- ✅ useTranslatedCompanyInfo hook for display
- ✅ Automatic language detection from browser/i18n settings
- ✅ Translated info in map popups (MarkerDetailsUI)
- ✅ Translated info in exhibitor list view
- ✅ Fallback chain: current language → Dutch → any available

### Database Layer
- ✅ Migration 012: company_translations table
- ✅ All queries updated to fetch company_translations
- ✅ RLS policies for authenticated access
- ✅ Data migration from deprecated Companies.info to Dutch translations

## 🔧 Manual Steps Required

### 1. Run Migration 012 in Supabase
```sql
-- Open Supabase SQL Editor and run:
-- /migrations/012_create_company_translations.sql
```

This migration will:
- Create company_translations table
- Add indexes for performance
- Enable RLS policies
- Migrate existing Companies.info data to Dutch (nl)
- Mark old info column as DEPRECATED

### 2. Test Translation Flow
1. **Admin Interface:**
   - Log in as admin
   - Go to Companies tab
   - Edit a company
   - See NL/EN tabs above Info field
   - Enter Dutch text in NL tab
   - Switch to EN tab, enter English text
   - Click away (auto-saves)
   - Verify 🌐 indicator appears in view mode

2. **Public Interface:**
   - Open map as normal user (no login)
   - Click on a company booth marker
   - Popup should show info in your browser's language
   - Test language toggle in top bar (NL/EN)
   - Info should switch languages dynamically

3. **Fallback Testing:**
   - Create company with only Dutch info
   - Switch interface to English
   - Should show Dutch info (fallback)
   - Add English translation
   - Should now show English when in EN mode

## 📊 Current State

### Migrations Status
- ✅ Migration 001-009: Already run (existing system)
- ⏳ Migration 010: Branding columns (pending)
- ⏳ Migration 011: User roles RLS (pending)
- ⏳ Migration 012: Company translations (pending) **← RUN THIS**

### Code Status
- ✅ All code committed to feature/development
- ⏳ Pending deployment to production
- ⏳ Pending migration execution

## 🚀 Deployment Steps

1. **Push to main:**
   ```bash
   git push origin feature/development
   git checkout main
   git merge feature/development
   git push origin main
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

3. **Run migrations in Supabase:**
   - Open Supabase dashboard
   - Go to SQL Editor
   - Run migration 012 (copy/paste content)

4. **Switch back to dev:**
   ```bash
   git checkout feature/development
   ```

## 🔮 Future Enhancements

- Add more languages (FR, DE, etc.) - infrastructure ready
- Bulk translation management
- Translation import/export
- Translation status indicators per language
- Machine translation integration (optional)

## 📝 Notes

- **Two separate language systems:**
  1. Manager UI language (i18n) - affects buttons, menus, settings
  2. Content translations (company_translations) - affects company info shown to public

- **Backward compatibility:**
  - Old Companies.info field kept for compatibility
  - Queries still fetch it as fallback
  - Migration marks it as DEPRECATED

- **Performance:**
  - Indexes on company_id and language_code
  - Composite index for lookups
  - Data fetched in single query (no N+1)
