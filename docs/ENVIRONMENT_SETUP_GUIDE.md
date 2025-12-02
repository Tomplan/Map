# Environment Setup Guide - Step by Step

## 🎯 Goal: Configure Supabase Credentials for Backup System

You need to get your Supabase database credentials and put them in the environment file.

## 📋 Step 1: Get Your Supabase Credentials

### From Supabase Dashboard:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (the Map project)
3. **Navigate to Settings** → **Database**
4. **Look for Connection String** - you'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   ```

### Extract these values:

From the connection string above:
- **Host**: `db.[YOUR-PROJECT].supabase.co`
- **Port**: `5432` (standard PostgreSQL)
- **Database**: `postgres`
- **User**: `postgres`  
- **Password**: `[YOUR-PASSWORD]` (the part between `postgres:` and `@`)

## 📝 Step 2: Create Environment File

```bash
# Copy the template
cp scripts/backup/.env.example scripts/backup/.env

# Edit the file
nano scripts/backup/.env
```

## ✏️ Step 3: Fill in Your Credentials

Edit `scripts/backup/.env` and replace these values:

```env
# Database Connection
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-actual-password-here
SUPABASE_DB_SSL=true

# You can keep all other settings as defaults for now
```

**⚠️ IMPORTANT**: Replace `your-actual-password-here` with your real password!

## ✅ Step 4: Test Configuration

```bash
# Test the backup system
npm run backup:test

# Or try a actual backup
npm run backup:critical
```

## 🔍 What Each Setting Means:

### Required Settings:
- `SUPABASE_DB_HOST` - Your database server address
- `SUPABASE_DB_PASSWORD` - Your database password (**most important**)

### Optional Settings (keep defaults for now):
- `BACKUP_RETENTION_DAYS=7` - Keep 7 days of daily backups
- `BACKUP_RETENTION_WEEKS=4` - Keep 4 weeks of weekly backups
- `BACKUP_RETENTION_MONTHS=12` - Keep 12 months of monthly backups

## 🆘 Troubleshooting:

### "Missing required environment variables"
✅ **Fixed** - Add your SUPABASE_DB_PASSWORD

### "Connection refused"
✅ **Check** - Verify SUPABASE_DB_HOST is correct

### "Password authentication failed"
✅ **Check** - Verify SUPABASE_DB_PASSWORD is correct

### npm v11 - Missing DevDependencies (vite, etc.)
⚠️ **Important**: npm v11.6.0 may have `omit = "dev"` configured, preventing devDependencies from installing.

**Symptoms:**
- Build fails with "Cannot find package 'vite'"
- Missing packages even after `npm install`
- `npm list vite` shows "(empty)"

**Quick Fix:**
```bash
npm install --include=dev
```

**Permanent Fix (may need to repeat):**
```bash
npm config set omit "" --location=user
```

**Alternative:** Consider downgrading to npm v10 if issue persists:
```bash
npm install -g npm@10
```

This issue was discovered during file-saver integration (Dec 2025) and affects all devDependencies including vite, @vitejs/plugin-react, and build tools.

## 🎉 Success!

Once configured correctly, you'll see:
```
[SUCCESS] Critical backup completed successfully
```

## 📞 Need Help?

If you can't find your credentials:
1. Check your Supabase dashboard → Settings → Database
2. Look for "Connection string" or "Database URL"
3. The format should be: `postgresql://user:password@host:port/database`

**Your backup system will be ready to protect your data automatically!** 🚀