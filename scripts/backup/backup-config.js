// Supabase Backup Configuration
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backup directory
config({ path: path.join(__dirname, '.env') });

export const backupConfig = {
  // Supabase connection
  database: {
    host: process.env.SUPABASE_DB_HOST || 'db.your-project.supabase.co',
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: process.env.SUPABASE_DB_SSL === 'true' || true
  },

  // Backup settings
  backup: {
    // Critical tables for daily backup
    criticalTables: [
      'companies',
      'event_subscriptions', 
      'assignments',
      'organization_profile',
      'user_preferences'
    ],

    // All tables for full backup
    allTables: [
      'companies',
      'event_subscriptions',
      'assignments', 
      'assignments_archive',
      'Markers_Core',
      'Markers_Appearance', 
      'Markers_Content',
      'organization_profile',
      'user_roles',
      'categories',
      'category_translations',
      'company_categories',
      'event_activities',
      'feedback_requests',
      'organization_settings',
      'company_translations',
      'marker_defaults'
    ],

    // Backup directories
    paths: {
      local: './backups',
      archive: './backups/archive'
    },

    // Retention policies
    retention: {
      daily: 7,      // Keep 7 daily backups
      weekly: 4,     // Keep 4 weekly backups  
      monthly: 12    // Keep 12 monthly backups
    }
  },

  // Cloud storage settings (optional)
  cloud: {
    provider: process.env.BACKUP_CLOUD_PROVIDER || 'google-drive', // 'google-drive', 'dropbox', or null
    credentials: {
      googleDrive: {
        clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      },
      dropbox: {
        accessToken: process.env.DROPBOX_ACCESS_TOKEN
      }
    }
  },

  // Notification settings
  notifications: {
    email: {
      enabled: process.env.BACKUP_EMAIL_ENABLED === 'true',
      to: process.env.BACKUP_EMAIL_TO,
      from: process.env.BACKUP_EMAIL_FROM || 'backup-system@localhost'
    },
    slack: {
      enabled: process.env.BACKUP_SLACK_ENABLED === 'true', 
      webhook: process.env.BACKUP_SLACK_WEBHOOK
    }
  },

  // Logging
  logging: {
    level: process.env.BACKUP_LOG_LEVEL || 'info',
    file: './logs/backup.log'
  }
};

// Validate required environment variables
export function validateConfig() {
  const required = ['SUPABASE_DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}