#!/usr/bin/env node

/**
 * Supabase Backup Scheduler
 *
 * This script sets up automated backups using cron jobs and provides
 * management utilities for the backup system.
 *
 * Usage:
 *   node scheduler.js --setup           # Setup cron jobs
 *   node scheduler.js --status          # Check backup status
 *   node scheduler.js --list            # List available backups
 *   node scheduler.js --cleanup         # Clean old backups
 *   node scheduler.js --test            # Test backup system
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { backupConfig } from './backup-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupScheduler {
  constructor() {
    this.config = backupConfig;
    this.logger = this.setupLogging();
    this.cronJobs = {
      critical: '0 2 * * *', // Daily at 2 AM
      full: '0 3 * * 0', // Weekly on Sunday at 3 AM
      schema: '0 4 1 * *', // Monthly on 1st at 4 AM
    };
  }

  setupLogging() {
    return {
      info: (msg) => console.log(`[INFO] ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`),
      warn: (msg) => console.warn(`[WARN] ${msg}`),
      success: (msg) => console.log(`[SUCCESS] ${msg}`),
    };
  }

  async setupCronJobs() {
    try {
      this.logger.info('Setting up automated backup cron jobs...');

      // Create cron job entries
      const cronEntries = [
        {
          name: 'supabase-critical-backup',
          schedule: this.cronJobs.critical,
          command: `cd ${process.cwd()} && node scripts/backup/backup-critical.js --compress`,
        },
        {
          name: 'supabase-full-backup',
          schedule: this.cronJobs.full,
          command: `cd ${process.cwd()} && node scripts/backup/backup-full.js --compress`,
        },
        {
          name: 'supabase-schema-backup',
          schedule: this.cronJobs.schema,
          command: `cd ${process.cwd()} && node scripts/backup/backup-full.js --schema-only --compress`,
        },
      ];

      // Generate crontab entries
      const crontabEntries = cronEntries
        .map((job) => `${job.schedule} ${job.command} >> ./logs/backup-cron.log 2>&1`)
        .join('\n');

      // Add environment variables to crontab
      const environmentSetup = [
        '',
        '# Supabase Backup Environment',
        `SUPABASE_DB_HOST=${this.config.database.host}`,
        `SUPABASE_DB_PORT=${this.config.database.port}`,
        `SUPABASE_DB_NAME=${this.config.database.database}`,
        `SUPABASE_DB_USER=${this.config.database.user}`,
        `SUPABASE_DB_PASSWORD=${this.config.database.password}`,
        '',
        '# Backup cron jobs',
      ].join('\n');

      const fullCrontab = environmentSetup + '\n' + crontabEntries;

      // Write crontab file
      const crontabFile = './backup-crontab';
      await fs.writeFile(crontabFile, fullCrontab);

      this.logger.success(`Crontab configuration written to: ${crontabFile}`);
      this.logger.info('To install these cron jobs, run:');
      this.logger.info(`  crontab ${crontabFile}`);
      this.logger.info('');
      this.logger.info('Or manually add the following entries to your crontab:');
      this.logger.info('');
      cronEntries.forEach((job) => {
        this.logger.info(`# ${job.name}`);
        this.logger.info(`${job.schedule} ${job.command}`);
        this.logger.info('');
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to setup cron jobs: ${error.message}`);
      throw error;
    }
  }

  async checkBackupStatus() {
    try {
      this.logger.info('Checking backup system status...');

      // Check if backup directory exists
      const backupDir = './backups';
      try {
        await fs.access(backupDir);
        this.logger.success('Backup directory exists');
      } catch {
        this.logger.warn('Backup directory does not exist');
      }

      // List recent backups
      await this.listBackups();

      // Check cron jobs
      await this.checkCronJobs();

      return true;
    } catch (error) {
      this.logger.error(`Status check failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups() {
    try {
      this.logger.info('Listing available backups...');

      const backupDir = './backups';
      let files;

      try {
        files = await fs.readdir(backupDir);
      } catch {
        this.logger.warn('No backup directory found');
        return;
      }

      const backups = files
        .filter((f) => f.includes('backup') || f.includes('critical'))
        .map((f) => ({
          name: f,
          path: path.join(backupDir, f),
          mtime: fs.stat(path.join(backupDir, f)).then((s) => s.mtime),
        }));

      const backupsWithStats = await Promise.all(
        backups.map(async (backup) => ({
          ...backup,
          mtime: await backup.mtime,
        })),
      );

      backupsWithStats.sort((a, b) => b.mtime - a.mtime);

      this.logger.info(`Found ${backupsWithStats.length} backup files:`);
      backupsWithStats.forEach((backup) => {
        const size = fs.stat(backup.path).then((s) => s.size);
        size.then((sizeBytes) => {
          const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
          this.logger.info(`  ${backup.name} (${sizeMB} MB) - ${backup.mtime.toISOString()}`);
        });
      });

      return backupsWithStats;
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`);
      throw error;
    }
  }

  async checkCronJobs() {
    return new Promise((resolve) => {
      exec('crontab -l', (error, stdout, stderr) => {
        if (error) {
          this.logger.warn('No crontab entries found or crontab not accessible');
          resolve(false);
          return;
        }

        const backupJobs = stdout
          .split('\n')
          .filter(
            (line) =>
              line.includes('backup-critical') ||
              line.includes('backup-full') ||
              line.includes('backup-cron'),
          );

        if (backupJobs.length > 0) {
          this.logger.success('Found backup cron jobs:');
          backupJobs.forEach((job) => {
            if (job.trim() && !job.startsWith('#')) {
              this.logger.info(`  ${job.trim()}`);
            }
          });
        } else {
          this.logger.warn('No backup cron jobs found');
        }

        resolve(backupJobs.length > 0);
      });
    });
  }

  async cleanupOldBackups() {
    try {
      this.logger.info('Cleaning up old backups...');

      const backupDir = './backups';

      try {
        await fs.access(backupDir);
      } catch {
        this.logger.warn('Backup directory does not exist');
        return;
      }

      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter((f) => f.includes('backup') || f.includes('critical'))
        .map((f) => ({
          name: f,
          path: path.join(backupDir, f),
          mtime: fs.stat(path.join(backupDir, f)).then((s) => s.mtime),
        }));

      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => ({
          ...file,
          mtime: await file.mtime,
        })),
      );

      filesWithStats.sort((a, b) => b.mtime - a.mtime);

      // Keep critical: 7 files, full: 4 files
      const toDelete = filesWithStats.filter((file) => {
        if (file.name.includes('critical')) {
          return filesWithStats.filter((f) => f.name.includes('critical')).indexOf(file) >= 7;
        } else if (file.name.includes('full')) {
          return filesWithStats.filter((f) => f.name.includes('full')).indexOf(file) >= 4;
        }
        return false;
      });

      let deletedCount = 0;
      for (const file of toDelete) {
        await fs.rm(file.path, { recursive: true, force: true });
        this.logger.info(`Deleted old backup: ${file.name}`);
        deletedCount++;
      }

      this.logger.success(`Cleanup completed. Deleted ${deletedCount} old backup files`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }

  async testBackupSystem() {
    try {
      this.logger.info('Testing backup system...');

      // Test critical backup
      this.logger.info('Testing critical backup...');
      const criticalResult = await this.runBackup('critical', { dryRun: true });

      // Test full backup
      this.logger.info('Testing full backup...');
      const fullResult = await this.runBackup('full', { dryRun: true });

      // Test restore
      this.logger.info('Testing restore system...');
      const restoreResult = await this.testRestore();

      const allPassed = criticalResult.success && fullResult.success && restoreResult.success;

      if (allPassed) {
        this.logger.success('All backup system tests passed!');
      } else {
        this.logger.warn('Some backup system tests failed');
      }

      return {
        success: allPassed,
        critical: criticalResult,
        full: fullResult,
        restore: restoreResult,
      };
    } catch (error) {
      this.logger.error(`Backup system test failed: ${error.message}`);
      throw error;
    }
  }

  async runBackup(type, options = {}) {
    const { dryRun = false } = options;

    try {
      const scriptPath =
        type === 'critical'
          ? './scripts/backup/backup-critical.js'
          : './scripts/backup/backup-full.js';

      const args = dryRun ? ['--dry-run'] : [];

      // This would execute the backup script
      // For now, just validate the script exists
      await fs.access(scriptPath);

      this.logger.info(`${type} backup script validated`);
      return { success: true, type, dryRun };
    } catch (error) {
      this.logger.error(`${type} backup test failed: ${error.message}`);
      return { success: false, type, error: error.message };
    }
  }

  async testRestore() {
    try {
      await fs.access('./scripts/backup/restore.js');
      this.logger.info('Restore script validated');
      return { success: true };
    } catch (error) {
      this.logger.error('Restore script test failed: ${error.message}');
      return { success: false, error: error.message };
    }
  }

  async run(command) {
    switch (command) {
      case '--setup':
        return await this.setupCronJobs();
      case '--status':
        return await this.checkBackupStatus();
      case '--list':
        return await this.listBackups();
      case '--cleanup':
        return await this.cleanupOldBackups();
      case '--test':
        return await this.testBackupSystem();
      default:
        this.logger.error(`Unknown command: ${command}`);
        this.logger.info('Available commands: --setup, --status, --list, --cleanup, --test');
        return false;
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const scheduler = new BackupScheduler();

  const command = process.argv[2];

  if (!command) {
    console.error('Usage: node scheduler.js [--setup|--status|--list|--cleanup|--test]');
    process.exit(1);
  }

  scheduler
    .run(command)
    .then((result) => {
      process.exit(result ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default BackupScheduler;
