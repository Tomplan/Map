# Backup Procedure for Free Supabase Account

## Overview

Since Supabase free accounts don't have built-in backup features, this document provides manual backup procedures to protect your data before any repository cleanup or database changes.

## Pre-Cleanup Backup (MANDATORY)

### Step 1: Access Database Credentials

From your Supabase dashboard:

1. Go to Settings → Database
2. Copy the connection details:
   - Host: `db.your-project.supabase.co`
   - Database name: `postgres`
   - Username: `postgres`
   - Password: (generate connection string)

### Step 2: Create SQL Dump

Run this command to backup critical tables:

```bash
# Method 1: Full database backup
pg_dump -h db.your-project.supabase.co -U postgres -d postgres \
  --no-password --clean --if-exists \
  > backup_full_$(date +%Y%m%d_%H%M%S).sql

# Method 2: Critical tables only (recommended)
pg_dump -h db.your-project.supabase.co -U postgres -d postgres \
  --no-password \
  --table=companies \
  --table=event_subscriptions \
  --table=assignments \
  --table=organization_profile \
  --table=Markers_Core \
  --table=Markers_Appearance \
  --table=Markers_Content \
  --table=user_roles \
  > backup_critical_$(date +%Y%m%d_%H%M%S).sql
```

### Step 3: Store Backup Securely

1. **Local Storage**: Keep copy on your machine
2. **Cloud Storage**: Upload to Google Drive, Dropbox, or iCloud
3. **Multiple Locations**: Never rely on single backup location

### Step 4: Verify Backup

Check your backup file contains data:

```bash
# Check file size and content
ls -la backup_critical_*.sql
head -20 backup_critical_*.sql

# Should see INSERT statements or table data
```

## Application-Level Backup (Alternative)

### Create Temporary Export Component

Add this to your app temporarily for JSON/CSV export:

```javascript
// Temporary backup utility
export const backupToJson = async () => {
  const tables = ['companies', 'event_subscriptions', 'assignments', 'organization_profile'];

  const backup = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) console.error(`Error backing up ${table}:`, error);
    else backup[table] = data;
  }

  // Download as JSON file
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
```

## Recovery Procedures

### Method 1: Restore from SQL Dump

```bash
# Restore from backup
psql -h db.your-project.supabase.co -U postgres -d postgres \
  --no-password < backup_critical_20251130_120000.sql
```

### Method 2: Restore Individual Tables

```bash
# Clear and restore specific table
psql -h db.your-project.supabase.co -U postgres -d postgres \
  --no-password -c "TRUNCATE TABLE companies CASCADE;"
psql -h db.your-project.supabase.co -U postgres -d postgres \
  --no-password < backup_companies.sql
```

## Emergency Contacts & Resources

### Supabase Support

- Dashboard: https://app.supabase.com
- Free tier limitations: No automatic backups
- Community: https://github.com/supabase/supabase/discussions

### Database Recovery

- PostgreSQL docs: https://www.postgresql.org/docs/
- Restore procedures: https://www.postgresql.org/docs/current/backup-dump.html

## Backup Schedule Recommendation

### Before Any Changes:

- [ ] Complete backup of critical tables
- [ ] Verify backup file integrity
- [ ] Store in multiple locations

### Ongoing (Weekly):

- [ ] Export critical data (companies, assignments)
- [ ] Keep 4 weekly backups rotating

### Before Major Updates:

- [ ] Full backup of all tables
- [ ] Test restore procedure
- [ ] Document any manual configuration

## Free Account Limitations

⚠️ **Important Notes:**

- No automated backups - manual process required
- No point-in-time recovery
- No backup retention policies
- Recovery requires manual SQL operations

**Recommendation:** Consider upgrading to Pro plan (~$25/month) for automatic backups if this application is business-critical.

## Repository Cleanup Impact

During repository cleanup:

1. **Migration files removed**: No impact on data
2. **Code cleanup**: No database changes
3. **Component removal**: Verify no API calls to deprecated tables
4. **Schema changes**: Will require fresh backup before execution

---

_Document created: 2025-11-30_  
_For repository cleanup safety_
