# Supabase Automated Backup System

A comprehensive backup solution for Supabase free accounts that lack built-in backup features.

## Features

- **Automated Daily Backups** - Critical data backed up daily at 2 AM
- **Weekly Full Backups** - Complete database backup weekly on Sundays
- **Monthly Schema Documentation** - Database structure backup monthly
- **Multiple Storage Options** - Local storage + cloud sync (Google Drive, Dropbox)
- **Automated Cleanup** - Automatic removal of old backups based on retention policy
- **Restore Functionality** - Easy restoration from any backup
- **Monitoring & Alerts** - Status checking and failure notifications
- **Cron Job Integration** - Automated scheduling

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp scripts/backup/.env.example scripts/backup/.env

# Edit with your Supabase credentials
# Get these from: Settings → Database in your Supabase dashboard
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PASSWORD=your-actual-password
# ... other settings
```

### 2. Install Dependencies

```bash
npm install
# archiver dependency will be installed automatically
```

### 3. Test Backup System

```bash
# Test the entire backup system
npm run backup:test

# Or test individual components
npm run backup:critical -- --dry-run
npm run backup:full -- --dry-run
```

### 4. Setup Automated Scheduling

```bash
# Setup cron jobs (will generate crontab configuration)
npm run backup:setup

# Install the generated crontab
crontab ./backup-crontab
```

### 5. Run First Backup

```bash
# Critical data backup (daily backup)
npm run backup:critical

# Full database backup (weekly backup)
npm run backup:full
```

## Available Commands

### Manual Backups

```bash
# Critical data backup (companies, subscriptions, assignments, etc.)
npm run backup:critical

# Full database backup (all tables + schema)
npm run backup:full

# Schema-only backup (database structure)
npm run backup:schema
```

### Restore Operations

```bash
# Restore from SQL file
npm run restore:critical -- --backup-file ./backups/critical-2025-11-30.sql --confirm

# Restore from backup directory
npm run restore:full -- --backup-dir ./backups/full-backup-2025-11-30 --confirm

# Dry run (test restore without making changes)
npm run restore:critical -- --backup-file ./backups/critical-2025-11-30.sql --dry-run
```

### Management & Monitoring

```bash
# Check backup system status
npm run backup:status

# List all available backups
npm run backup:list

# Clean up old backups
npm run backup:cleanup

# Test entire backup system
npm run backup:test
```

## Backup Schedule

The system runs three types of backups automatically:

| Backup Type | Schedule | Contents | Retention |
|-------------|----------|----------|-----------|
| **Critical** | Daily at 2 AM | Essential tables only | 7 days |
| **Full** | Weekly on Sunday at 3 AM | Complete database | 4 weeks |
| **Schema** | Monthly on 1st at 4 AM | Database structure | 12 months |

## Backup Contents

### Critical Tables (Daily)
- `companies` - Exhibitor information
- `event_subscriptions` - Event logistics
- `assignments` - Booth mappings
- `organization_profile` - Branding/settings
- `user_preferences` - User settings

### Full Database (Weekly)
- All tables from critical backup
- Plus all additional tables:
  - `Markers_Core`, `Markers_Appearance`, `Markers_Content`
  - `user_roles`, `categories`, `event_activities`
  - And all other application tables

### Schema Documentation (Monthly)
- Complete database structure
- Table relationships
- Column definitions
- Constraints and indexes

## File Structure

```
scripts/backup/
├── backup-config.js      # Configuration settings
├── backup-critical.js    # Daily critical backup script
├── backup-full.js        # Full database backup script
├── restore.js            # Database restoration script
├── scheduler.js          # Automation and management
├── .env.example          # Environment template
└── README.md            # This file

backups/                  # Backup storage directory
├── critical-2025-11-30.zip
├── full-backup-2025-11-30.zip
└── archive/             # Old backups

logs/                     # Backup operation logs
└── backup-2025-11-30.log
```

## Configuration

### Environment Variables

Copy `scripts/backup/.env.example` to `scripts/backup/.env` and configure:

**Required:**
- `SUPABASE_DB_PASSWORD` - Your Supabase database password

**Optional:**
- `BACKUP_RETENTION_DAYS` - Days to keep daily backups (default: 7)
- `BACKUP_RETENTION_WEEKS` - Weeks to keep weekly backups (default: 4)
- `BACKUP_RETENTION_MONTHS` - Months to keep monthly backups (default: 12)

### Cloud Storage (Optional)

To automatically sync backups to cloud storage:

**Google Drive:**
```bash
GOOGLE_DRIVE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
```

**Dropbox:**
```bash
DROPBOX_ACCESS_TOKEN=your-access-token
```

## Safety Features

### Automatic Safety Backup
Before any restore operation, the system automatically creates a safety backup of the current database state.

### Dry Run Testing
All restore operations support `--dry-run` flag to test without making changes.

### Validation
Backup files are validated for integrity before use in restore operations.

### Logging
All backup and restore operations are logged with timestamps and status information.

## Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Ensure `scripts/backup/.env` exists and contains `SUPABASE_DB_PASSWORD`

**"pg_dump: command not found"**
- Install PostgreSQL client tools: `brew install postgresql` (macOS) or `sudo apt install postgresql-client` (Linux)

**"Backup failed: connection refused"**
- Verify Supabase connection settings in `.env`
- Check that your IP is allowed in Supabase dashboard

**"Permission denied"**
- Ensure backup scripts have execute permissions: `chmod +x scripts/backup/*.js`

### Getting Help

1. Check the logs in `./logs/` directory
2. Run `npm run backup:test` to diagnose issues
3. Use `npm run backup:status` to check system health
4. Review the backup configuration in `scripts/backup/backup-config.js`

## Security Notes

- Never commit `.env` files to version control
- Use environment variables for sensitive data
- Consider encrypting backup files for additional security
- Regularly test restore procedures to ensure backups work

## Production Deployment

1. Set up proper environment variables on production server
2. Install PostgreSQL client tools on production server
3. Configure cron jobs with proper user permissions
4. Set up monitoring alerts for backup failures
5. Test backup and restore procedures in staging environment first

---

**This backup system provides enterprise-grade data protection for your Supabase application, even on free accounts!**