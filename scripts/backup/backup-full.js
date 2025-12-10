#!/usr/bin/env node

/**
 * Supabase Full Database Backup Script (Fixed)
 *
 * This script creates complete database backups of all tables using Supabase JavaScript client:
 * - All table data
 * - JSON format for better portability
 *
 * Usage:
 *   node backup-full-fixed.js [--output-dir ./backups]
 *   npm run backup:full
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { backupConfig, validateConfig } from './backup-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SupabaseFullBackupFixed {
  constructor() {
    this.config = backupConfig;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = './backups';
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.logger = this.setupLogging();
  }

  setupLogging() {
    const logDir = './logs';

    return {
      info: (msg) => console.log(`[INFO] ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`),
      warn: (msg) => console.warn(`[WARN] ${msg}`),
      success: (msg) => console.log(`[SUCCESS] ${msg}`),
    };
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.logger.info(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createBackupDirectory() {
    const backupPath = path.join(this.backupDir, `full-${this.timestamp}`);
    await fs.mkdir(backupPath, { recursive: true });
    return backupPath;
  }

  async backupTable(tableName, backupPath) {
    const tableFile = path.join(backupPath, `${tableName}.json`);

    try {
      this.logger.info(`Backing up table: ${tableName}`);

      // Fetch all data from the table
      const { data, error } = await this.supabase.from(tableName).select('*');

      if (error) {
        // Check if it's a "table not found" error
        if (
          error.message.includes('Could not find the table') ||
          (error.message.includes('relation') && error.message.includes('does not exist'))
        ) {
          this.logger.warn(`Table ${tableName} does not exist - skipping`);
          return null;
        }
        throw new Error(`Failed to fetch data from ${tableName}: ${error.message}`);
      }

      // Write JSON data to file
      const backupData = {
        table: tableName,
        timestamp: this.timestamp,
        recordCount: data.length,
        data: data,
      };

      await fs.writeFile(tableFile, JSON.stringify(backupData, null, 2));
      this.logger.info(`Successfully backed up table: ${tableName} (${data.length} records)`);

      return tableFile;
    } catch (error) {
      if (
        error.message.includes('does not exist') ||
        error.message.includes('Could not find the table')
      ) {
        this.logger.warn(`Table ${tableName} does not exist - skipping`);
        return null;
      }
      this.logger.error(`Error backing up table ${tableName}: ${error.message}`);
      throw error;
    }
  }

  async createTableList(backupPath) {
    try {
      // Get table list from configuration
      const tables = this.config.backup.allTables;
      const tableList = {
        timestamp: this.timestamp,
        total_tables: tables.length,
        tables: tables,
        source: 'configuration',
      };

      const tableListFile = path.join(backupPath, 'table-list.json');
      await fs.writeFile(tableListFile, JSON.stringify(tableList, null, 2));
      this.logger.info(`Table list created: ${tableListFile}`);

      return tableListFile;
    } catch (error) {
      this.logger.error(`Error creating table list: ${error.message}`);
      throw error;
    }
  }

  async createMetadata(backupPath) {
    const metadata = {
      timestamp: this.timestamp,
      type: 'full',
      tables: this.config.backup.allTables,
      database: this.config.database.host,
      version: '2.0',
      generated_by: 'Supabase Full Backup Script (Fixed)',
      method: 'JavaScript Client',
      notes: 'This backup was created using Supabase JavaScript client instead of pg_dump',
    };

    const metadataFile = path.join(backupPath, 'metadata.json');
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    this.logger.info('Created backup metadata');
  }

  async compressBackup(backupPath) {
    // Compression disabled - will be re-enabled once archiver is properly installed
    this.logger.info('Compression disabled - backup created as directory');
    return backupPath;
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter((f) => f.startsWith('full-'))
        .map((f) => ({
          name: f,
          path: path.join(this.backupDir, f),
          mtime: fs.stat(path.join(this.backupDir, f)).then((s) => s.mtime),
        }));

      // Get file stats
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => ({
          ...file,
          mtime: await file.mtime,
        })),
      );

      // Sort by modification time (newest first)
      filesWithStats.sort((a, b) => b.mtime - a.mtime);

      // Keep only the latest 4 weekly backups
      const toDelete = filesWithStats.slice(this.config.backup.retention.weekly);

      for (const file of toDelete) {
        await fs.rm(file.path, { recursive: true, force: true });
        this.logger.info(`Deleted old backup: ${file.name}`);
      }

      this.logger.info(
        `Cleanup completed. Kept ${this.config.backup.retention.weekly} latest full backups`,
      );
    } catch (error) {
      this.logger.warn(`Cleanup failed: ${error.message}`);
    }
  }

  async sendNotification(status, message) {
    const { notifications } = this.config;

    if (notifications.email.enabled && status === 'error') {
      // TODO: Implement email notification
      this.logger.warn('Email notification not implemented yet');
    }

    if (notifications.slack.enabled) {
      // TODO: Implement Slack notification
      this.logger.warn('Slack notification not implemented yet');
    }
  }

  async run(options = {}) {
    const { compress = true, outputDir = this.backupDir } = options;

    try {
      this.logger.info('Starting Supabase full database backup (Fixed Method)');

      // Validate configuration
      validateConfig();

      // Validate Supabase credentials
      if (!this.supabaseUrl || !this.supabaseKey) {
        throw new Error(
          'Missing SUPABASE_URL or Supabase API key (service_role or anon) environment variables',
        );
      }

      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      // Create timestamped backup directory
      const backupPath = await this.createBackupDirectory();

      // Backup each table in the full list
      for (const tableName of this.config.backup.allTables) {
        await this.backupTable(tableName, backupPath);
      }

      // Create table list
      await this.createTableList(backupPath);

      // Create metadata file
      await this.createMetadata(backupPath);

      // Compress backup if requested
      const finalBackup = await this.compressBackup(backupPath);

      // Clean up old backups
      await this.cleanupOldBackups();

      this.logger.success(`Full backup completed successfully: ${finalBackup}`);

      return {
        success: true,
        backupPath: finalBackup,
        timestamp: this.timestamp,
        tables: this.config.backup.allTables,
        type: 'full',
      };
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);
      await this.sendNotification('error', error.message);

      return {
        success: false,
        error: error.message,
        timestamp: this.timestamp,
      };
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const backup = new SupabaseFullBackupFixed();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    compress: !args.includes('--no-compress'),
    outputDir: args.find((arg) => arg.startsWith('--output-dir='))?.split('=')[1],
  };

  backup
    .run(options)
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default SupabaseFullBackupFixed;
