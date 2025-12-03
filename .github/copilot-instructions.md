# Copilot Instructions for Event Map App

## Project Overview

A production-ready, mobile-first React 19 web application for event navigation and management, hosted on GitHub Pages. Features an interactive map with exhibitor information, comprehensive admin dashboard, real-time updates, and automated backup system.

### Technology Stack
- **Frontend**: React 19, React Router 7, Vite 4, Tailwind CSS
- **Map**: Leaflet with multiple plugins (minimap, search, locate, clustering, browser print)
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **State Management**: React hooks, context providers, Supabase subscriptions
- **Testing**: Jest, React Testing Library, Puppeteer
- **Development**: ESLint, Prettier, TypeScript types
- **Deployment**: GitHub Pages with automated build pipeline

## 🏗️ Architecture & Core Patterns

### Component Structure
```
src/
├── App.jsx                 # Main app with real-time sync patterns
├── main.jsx               # Entry point with Supabase bridge
├── components/
│   ├── admin/            # Admin dashboard components
│   ├── common/           # Shared UI components
│   └── EventMap/         # Map components and controls
├── contexts/             # React contexts (Preferences, Organization, Dialog)
├── hooks/                # Custom hooks (useMarkersState, useEventMarkers)
├── services/             # API services and Supabase queries
├── utils/                # Utility functions and helpers
├── locales/              # i18n translations (en.json, nl.json)
└── supabaseClient.js     # Configured Supabase instance
```

### Key Architecture Patterns

#### 1. Real-time State Synchronization
- **Bidirectional sync**: localStorage ↔ Supabase with conflict resolution
- **Feedback loop prevention**: Ref-based flags prevent infinite update cycles
- **Real-time subscriptions**: Supabase channels for live updates across clients

#### 2. Context Provider Pattern
- `PreferencesProvider`: Single source of truth for user preferences
- `OrganizationLogoProvider`: Dynamic branding and logo management
- `DialogProvider`: Modal and dialog state management

#### 3. Custom Hooks Architecture
- `useMarkersState`: Centralized marker management with real-time updates
- `useEventMarkers`: Event data fetching with year-based filtering
- `useEventYears`: Multi-year event management

## 🚀 Development Commands Reference

### Essential Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests (Jest + React Testing Library)
npm test

# Code quality
npm run lint              # Check ESLint rules
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format with Prettier
```

### Server Management
```bash
# Clean development server termination
npm run kill:dev          # Gracefully stop all dev processes

# Manual process management
bash scripts/kill-dev-servers.sh --force    # Force kill immediately
bash scripts/kill-dev-servers.sh --port 5173  # Target specific port
```

### Advanced Backup & Data Commands
```bash
# Automated backup system
npm run backup:critical          # Daily essential data backup
npm run backup:full              # Complete database backup
npm run backup:schema            # Schema-only documentation
npm run backup:status            # Check backup system health
npm run backup:list              # List available backups
npm run backup:cleanup           # Remove old backups
npm run backup:test              # Test entire backup system
npm run backup:setup             # Configure automated scheduling

# Data restoration
npm run restore:critical -- --backup-file ./backups/critical-2025-11-30.sql
npm run restore:full -- --backup-dir ./backups/full-backup-2025-11-30
```

### Data Management Scripts
```bash
# Company data processing
npm run normalize:phones -- --dry-run    # Normalize phone number formats
npm run scrape:emails                    # Extract company email addresses

# Development utilities
npm run capture_admin_screenshot         # Generate admin panel screenshots
npm run auto-categorize-companies        # Auto-categorize company data
```

## 🔄 Advanced Features

### Real-time Data Synchronization

#### Marker Management
- **Live updates**: All marker changes propagate instantly to connected clients
- **Optimistic UI**: Immediate feedback with rollback on failure
- **Conflict resolution**: Timestamp-based resolution for simultaneous edits
- **Offline support**: Local storage caching with background sync

#### Year-based Event Management
- **Multi-year support**: Archive previous years, copy to new years
- **Bidirectional sync**: Year selection syncs across devices
- **Data isolation**: Complete separation between event years

### Map Features
- **Multiple map layers**: Carto Voyager, Esri World Imagery
- **Custom zoom controls**: Material Design icons, 0.5 zoom steps
- **Marker clustering**: Performance optimization at low zoom levels
- **Search integration**: Real-time marker search with Leaflet search plugin
- **Rectangle overlays**: 6x6m booth displays with rotation and repositioning
- **Browser print support**: Built-in map printing functionality

### Admin Dashboard
- **Role-based access**: Super Admin, System Manager, Event Manager roles
- **Drag-and-drop interface**: Intuitive marker positioning
- **Lock mechanism**: Prevent changes during live events
- **Real-time preview**: All changes reflected immediately on public map
- **Undo/redo system**: Full operation history with rollback capability

## 📊 Database Schema & Migration Strategy

### Key Tables Structure
```sql
-- Core marker data (separated for performance)
Markers_Core        # Essential marker properties
Markers_Appearance  # Visual styling and sizing
Markers_Content     # Text content and descriptions

-- Event management
companies           # Exhibitor information
event_subscriptions # Registration and logistics
assignments         # Booth-to-company mappings
event_activities    # Event schedule and program

-- System data
organization_profile # Branding and settings
user_roles          # Access control
categories          # Exhibitor categorization
```

### Migration Strategy
- **Sequential migrations**: All migrations in `migrations/` folder
- **RLS policies**: Comprehensive Row Level Security implementation
- **Real-time enabled**: Tables configured for live updates
- **Backup integration**: Schema backup included in automated system

## 🛡️ Backup & Data Protection

### Automated Backup System
The project includes a comprehensive backup solution for Supabase free accounts:

#### Backup Types
- **Critical**: Daily backup of essential tables (7-day retention)
- **Full**: Weekly complete database backup (4-week retention)  
- **Schema**: Monthly database structure documentation (12-month retention)

#### Key Features
- **Automated scheduling**: Cron job integration
- **Cloud sync**: Google Drive and Dropbox integration
- **Safety measures**: Automatic pre-restore backups
- **Validation**: Integrity checking for all backup files
- **Monitoring**: Status checking and failure alerts

#### Configuration
```bash
# Environment setup
cp scripts/backup/.env.example scripts/backup/.env

# Essential variables
SUPABASE_DB_HOST=db.project.supabase.co
SUPABASE_DB_PASSWORD=your-password
BACKUP_RETENTION_DAYS=7
```

### Restore Procedures
```bash
# Test restore (dry run)
npm run restore:critical -- --backup-file backup.sql --dry-run

# Execute restore (creates safety backup first)
npm run restore:critical -- --backup-file backup.sql --confirm
```

## 🧪 Testing & Quality Assurance

### Testing Infrastructure
- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Puppeteer**: End-to-end testing and screenshot capture
- **Jest DOM**: Additional DOM assertion matchers

### Test Categories
```bash
# Run all tests
npm test

# Accessibility testing
npx jest src/App.a11y.test.js

# Marker rendering tests
npx jest --testPathPattern=marker

# Component integration tests
npx jest --testPathPattern=components
```

### Quality Assurance Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **TypeScript types**: Runtime type checking for React components
- **GitHub Actions**: Automated CI/CD pipeline

## 🚀 Deployment & Production

### GitHub Pages Deployment
```bash
# Build and deploy to GitHub Pages
npm run deploy

# Manual process
npm run build          # Creates dist/ folder
# Push dist/ to gh-pages branch
```

### Production Considerations
- **Environment variables**: Vite env variables for Supabase config
- **Service worker**: Caching for offline map tile access
- **Performance**: Code splitting, lazy loading, marker clustering
- **Security**: RLS policies, secure admin-only data handling

### Environment Configuration
```bash
# .env file (not committed)
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🔧 Development Workflows

### Adding New Features
1. Create feature branch from main
2. Implement component with proper TypeScript types
3. Add tests for new functionality
4. Update documentation and translations
5. Run full test suite: `npm test && npm run lint`
6. Create pull request with descriptive commit

### Database Changes
1. Create new migration file in `migrations/`
2. Test migration on development database
3. Update backup system if schema changes
4. Update documentation for new tables/fields

### Code Standards
- **Component naming**: PascalCase for React components
- **File organization**: Group related files in logical folders
- **Import ordering**: External libraries, internal utilities, local components
- **State management**: Prefer hooks over class components
- **Error handling**: Comprehensive try/catch with user-friendly messages

## 🐛 Troubleshooting Guide

### Common Development Issues

#### Development Server Won't Start
```bash
# Check for port conflicts
lsof -ti:5173 | xargs kill -9

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Kill all dev processes and restart
npm run kill:dev && npm run dev
```

#### Map Not Loading
- Verify Supabase credentials in `.env`
- Check browser console for Leaflet plugin errors
- Ensure service worker is registered
- Validate marker data is loading from Supabase

#### Real-time Updates Not Working
- Check Supabase channel subscriptions in Network tab
- Verify RLS policies allow real-time updates
- Ensure database has real-time enabled for tables
- Test with multiple browser tabs open

#### Backup System Issues
```bash
# Test backup system
npm run backup:test

# Check backup status
npm run backup:status

# Verify PostgreSQL client installation
pg_dump --version
```

### Performance Optimization

#### Map Performance
- **Marker clustering**: Enabled for zoom levels < 13
- **Lazy loading**: Components load on demand
- **Image optimization**: SVG icons with proper sizing
- **Memory management**: Proper cleanup of event listeners

#### Database Performance
- **Index optimization**: Indexed on frequently queried columns
- **Pagination**: Large datasets paginated
- **Connection pooling**: Managed by Supabase
- **Query optimization**: Selective field fetching

## 📚 References & Resources

### Documentation Files
- `README.md` - Complete project overview and setup guide
- `docs/` - Comprehensive documentation for all features
- `migrations/` - Database schema and migration history
- `scripts/backup/README.md` - Backup system documentation

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `vite.config.js` - Build tool configuration
- `tailwind.config.cjs` - CSS framework configuration
- `jest.config.cjs` - Testing framework setup
- `.eslintrc.js` - Code quality rules

### Key Dependencies
- **React 19**: Latest React with concurrent features
- **Supabase 2.76**: Database and real-time capabilities
- **Leaflet 1.9**: Interactive mapping functionality
- **Tailwind CSS 3.4**: Utility-first CSS framework

---

## Agent Rules

### Proactive Guidance Rule

Always point out:
- Expected errors or warnings due to incomplete setup
- Steps users need to complete (credentials, configuration, commands)
- Limitations or requirements before features work
- Diagnostic procedures for complex issues

Always inspect computed styles for both container and SVG elements when diagnosing UI sizing issues. If SVG is not sized as expected, check viewBox and path width. Browser may shrink icon to fit path, not container.

### User Collaboration Rule

If code inspection cannot fully resolve a user request, proactively ask for:
- Runtime data and field values
- Console output and error messages  
- Screenshots of UI issues
- Network tab information for API calls

User collaboration is essential for issues depending on live data or environment state.

### Development Best Practices

- **Always validate in live UI**: Tests may pass in isolation but fail in integration
- **Systematic debugging**: Step-by-step deduction faster than trial-and-error
- **Real-time validation**: Test changes across multiple browser tabs
- **Performance monitoring**: Check browser dev tools for memory leaks and performance issues

### Code Quality Standards

- **Type safety**: Use TypeScript types for all component props and function parameters
- **Error boundaries**: Implement React error boundaries for graceful failure handling
- **Accessibility**: Ensure all interactive elements have proper ARIA labels and keyboard navigation
- **Internationalization**: All user-facing text goes through i18n system
- **Security**: Never expose admin-only data in public files or client-side code
