#!/usr/bin/env node

/**
 * Supabase Database Restore Script
 *
 * This script restores databases from backup files created by backup scripts.
 *
 * Usage:
 *   node restore.js --backup-file ./backups/critical-2025-11-30.sql [--dry-run]
 *   node restore.js --backup-dir ./backups/critical-2025-11-30 [--confirm]
 *   npm run restore:critical -- --backup-file ./backups/critical-2025-11-30.sql
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { backupConfig, validateConfig } from './backup-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SupabaseRestore {
  constructor() {
    this.config = backupConfig;
    this.logger = this.setupLogging();
  }

  setupLogging() {
    return {
      info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
      error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
      warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
      success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
      danger: (msg) => console.log(`[DANGER] ${new Date().toISOString()} - ${msg}`),
    };
  }

  async validateBackupFile(backupFile) {
    try {
      await fs.access(backupFile);
      const stats = await fs.stat(backupFile);

      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      this.logger.info(
        `Backup file validated: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Backup file validation failed: ${error.message}`);
      throw error;
    }
  }

  async validateBackupDirectory(backupDir) {
    try {
      const metadataFile = path.join(backupDir, 'metadata.json');
      await fs.access(metadataFile);

      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));
      this.logger.info(`Backup directory validated: ${backupDir}`);
      this.logger.info(`Backup type: ${metadata.type}, timestamp: ${metadata.timestamp}`);

      return metadata;
    } catch (error) {
      this.logger.error(`Backup directory validation failed: ${error.message}`);
      throw error;
    }
  }

  async readMetadata(backupFile) {
    try {
      // For SQL dump files, try to extract metadata from filename
      if (backupFile.endsWith('.sql')) {
        const filename = path.basename(backupFile);
        const match = filename.match(/(critical|full)-backup-([0-9-T-Z]+)\.sql/);

        if (match) {
          return {
            type: match[1],
            timestamp: match[2],
            generated_by: 'backup script',
          };
        }
      }

      throw new Error('Could not parse metadata from backup file');
    } catch (error) {
      this.logger.error(`Failed to read metadata: ${error.message}`);
      throw error;
    }
  }

  async createBackupBeforeRestore() {
    try {
      this.logger.info('Creating safety backup before restore...');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safetyBackupFile = `pre-restore-backup-${timestamp}.sql`;

      const dbConfig = this.config.database;
      const pgDumpCommand = `pg_dump \\
        --host=${dbConfig.host} \\
        --port=${dbConfig.port} \\
        --username=${dbConfig.user} \\
        --dbname=${dbConfig.database} \\
        --no-password \\
        --clean \\
        --if-exists`;

      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      return new Promise((resolve, reject) => {
        exec(pgDumpCommand, { env }, async (error, stdout, stderr) => {
          if (error) {
            this.logger.warn(`Safety backup failed: ${error.message}`);
            this.logger.warn('Proceeding with restore without safety backup...');
            resolve(null);
            return;
          }

          await fs.writeFile(safetyBackupFile, stdout);
          this.logger.success(`Safety backup created: ${safetyBackupFile}`);
          resolve(safetyBackupFile);
        });
      });
    } catch (error) {
      this.logger.warn(`Safety backup creation failed: ${error.message}`);
      return null;
    }
  }

  async restoreFromSqlFile(sqlFile, options = {}) {
    const { dryRun = false, table = null } = options;

    try {
      const dbConfig = this.config.database;

      let restoreCommand;
      if (table) {
        // Restore specific table
        restoreCommand = `psql \\
          --host=${dbConfig.host} \\
          --port=${dbConfig.port} \\
          --username=${dbConfig.user} \\
          --dbname=${dbConfig.database} \\
          --no-password \\
          --file=${sqlFile} \\
          --table=${table}`;
      } else {
        // Restore entire database
        restoreCommand = `psql \\
          --host=${dbConfig.host} \\
          --port=${dbConfig.port} \\
          --username=${dbConfig.user} \\
          --dbname=${dbConfig.database} \\
          --no-password \\
          --file=${sqlFile}`;
      }

      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      if (dryRun) {
        this.logger.info(`[DRY RUN] Would execute: ${restoreCommand}`);
        return { success: true, dryRun: true };
      }

      this.logger.info(`Starting restore from: ${sqlFile}`);

      return new Promise((resolve, reject) => {
        const child = exec(restoreCommand, { env }, (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`Restore failed: ${error.message}`);
            this.logger.error(`stderr: ${stderr}`);
            reject(error);
            return;
          }

          this.logger.success(`Restore completed successfully`);

          // Log important output
          if (stdout) {
            const lines = stdout.split('\n');
            const relevantLines = lines.filter(
              (line) =>
                line.includes('INSERT') ||
                line.includes('COPY') ||
                line.includes('ALTER') ||
                line.includes('ERROR'),
            );
            relevantLines.forEach((line) => this.logger.info(line));
          }

          resolve({ success: true, output: stdout });
        });
      });
    } catch (error) {
      this.logger.error(`Restore error: ${error.message}`);
      throw error;
    }
  }

  async restoreFromDirectory(backupDir, options = {}) {
    const { dryRun = false, replace = false } = options;

    try {
      // Read metadata
      const metadata = await this.validateBackupDirectory(backupDir);

      // Get all JSON table files (excluding metadata.json and table-list.json)
      const tableFiles = await fs.readdir(backupDir);
      const dataFiles = tableFiles.filter(
        (f) => f.endsWith('.json') && f !== 'metadata.json' && f !== 'table-list.json',
      );

      this.logger.info(`Found ${dataFiles.length} table files to restore`);

      // Determine restore order: tables with foreign key dependencies should be
      // restored after the tables they reference. We define a safe ordering.
      const restoreOrder = [
        'organization_profile',
        'organization_settings',
        'user_roles',
        'user_preferences',
        'categories',
        'category_translations',
        'companies',
        'company_categories',
        'company_translations',
        'event_subscriptions',
        'event_subscriptions_archive',
        'assignments',
        'assignments_archive',
        'markers_core',
        'markers_appearance',
        'markers_content',
        'event_activities',
        'event_activities_archive',
        'event_map_settings',
        'map_snapshots',
        'feedback_requests',
        'feedback_votes',
        'feedback_comments',
        'staged_invoices',
        'subscription_line_items',
        'invoice_folders',
      ];

      // Sort data files according to restoreOrder; unknown tables go at the end
      const sortedFiles = dataFiles.sort((a, b) => {
        const nameA = path.parse(a).name;
        const nameB = path.parse(b).name;
        const indexA = restoreOrder.indexOf(nameA);
        const indexB = restoreOrder.indexOf(nameB);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      // If replace mode, truncate tables in REVERSE order (dependents first)
      if (replace && !dryRun) {
        this.logger.warn('Replace mode enabled — truncating tables before restore');
        const reverseFiles = [...sortedFiles].reverse();
        for (const tableFile of reverseFiles) {
          const tableName = path.parse(tableFile).name;
          this.logger.info(`Truncating table: ${tableName}`);
          await this.truncateTable(tableName);
        }
      } else if (replace && dryRun) {
        this.logger.info('[DRY RUN] Would truncate all tables before restoring');
      }

      for (const tableFile of sortedFiles) {
        const tableName = path.parse(tableFile).name;
        this.logger.info(`Processing table: ${tableName}`);

        const fileContent = await fs.readFile(path.join(backupDir, tableFile), 'utf8');
        const parsed = JSON.parse(fileContent);

        // Handle both formats: raw array or { data: [...] }
        const jsonData = Array.isArray(parsed) ? parsed : parsed.data;

        if (!dryRun && Array.isArray(jsonData)) {
          await this.restoreTableData(tableName, jsonData, { replace });
        } else if (dryRun) {
          const count = Array.isArray(jsonData) ? jsonData.length : 0;
          this.logger.info(`[DRY RUN] Would restore ${count} rows to ${tableName}`);
        }
      }

      return { success: true, type: metadata.type, dryRun, tablesRestored: sortedFiles.length };
    } catch (error) {
      this.logger.error(`Directory restore failed: ${error.message}`);
      throw error;
    }
  }

  async truncateTable(tableName) {
    try {
      const { error } = await this.getSupabaseClient()
        .from(tableName)
        .delete()
        .neq('id', -99999);

      if (error) {
        this.logger.warn(`Could not truncate ${tableName} via API: ${error.message}`);
      } else {
        this.logger.info(`Truncated table: ${tableName}`);
      }
    } catch (err) {
      this.logger.warn(`Truncate fallback for ${tableName}: ${err.message}`);
    }
  }

  getSupabaseClient() {
    if (!this._supabase) {
      const { createClient } = require('@supabase/supabase-js');
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      this._supabase = createClient(url, key);
    }
    return this._supabase;
  }

  async restoreTableData(tableName, data, options = {}) {
    const { dryRun = false, replace = false } = options;

    try {
      if (dryRun) {
        this.logger.info(`[DRY RUN] Would restore ${data.length} rows to table: ${tableName}`);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        this.logger.info(`No data to restore for table: ${tableName}`);
        return;
      }

      // Create batch INSERT statements
      const batchSize = 1000; // PostgreSQL limit
      const batches = Math.ceil(data.length / batchSize);
      const conflictClause = replace ? '' : ' ON CONFLICT DO NOTHING';

      for (let i = 0; i < batches; i++) {
        const batch = data.slice(i * batchSize, (i + 1) * batchSize);
        const columns = Object.keys(batch[0]);

        // Create INSERT statement
        const values = batch
          .map(
            (row) =>
              '(' +
              columns
                .map((col) => {
                  const value = row[col];
                  if (value === null || value === undefined) return 'NULL';
                  return `'${String(value).replace(/'/g, "''")}'`;
                })
                .join(', ') +
              ')',
          )
          .join(', ');

        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values}${conflictClause};`;

        await this.executeSql(sql);
      }

      this.logger.success(`Restored ${data.length} rows to table: ${tableName}`);
    } catch (error) {
      this.logger.error(`Failed to restore table ${tableName}: ${error.message}`);
      throw error;
    }
  }

  async executeSql(sql) {
    const dbConfig = this.config.database;
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    return new Promise((resolve, reject) => {
      const command = `psql \\
        --host=${dbConfig.host} \\
        --port=${dbConfig.port} \\
        --username=${dbConfig.user} \\
        --dbname=${dbConfig.database} \\
        --no-password \\
        --command="${sql.replace(/"/g, '\\"')}"`;

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async run(options = {}) {
    const { backupFile, backupDir, dryRun = false, table = null, confirm = false, replace = false } = options;

    try {
      this.logger.info('Starting Supabase database restore');

      validateConfig();

      // Safety confirmation
      if (!dryRun && !confirm) {
        this.logger.danger('WARNING: This will overwrite database data!');
        this.logger.info('Use --confirm flag to proceed or --dry-run to test');
        if (replace) {
          this.logger.danger('REPLACE MODE: Tables will be TRUNCATED before restoring!');
        }
        return { success: false, error: 'Confirmation required' };
      }

      // Create safety backup
      const safetyBackup = await this.createBackupBeforeRestore();

      let restoreResult;

      if (backupFile) {
        // Restore from SQL file
        await this.validateBackupFile(backupFile);
        restoreResult = await this.restoreFromSqlFile(backupFile, { dryRun, table });
      } else if (backupDir) {
        // Restore from directory
        restoreResult = await this.restoreFromDirectory(backupDir, { dryRun, replace });
      } else {
        throw new Error('Either --backup-file or --backup-dir must be specified');
      }

      if (safetyBackup) {
        this.logger.info(`Safety backup available at: ${safetyBackup}`);
      }

      this.logger.success(`Restore process completed: ${JSON.stringify(restoreResult)}`);

      return {
        success: true,
        ...restoreResult,
        safetyBackup,
      };
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const restore = new SupabaseRestore();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    backupFile: args.find((arg) => arg.startsWith('--backup-file='))?.split('=')[1],
    backupDir: args.find((arg) => arg.startsWith('--backup-dir='))?.split('=')[1],
    dryRun: args.includes('--dry-run'),
    table: args.find((arg) => arg.startsWith('--table='))?.split('=')[1],
    confirm: args.includes('--confirm'),
    replace: args.includes('--replace'),
  };

  if (!options.backupFile && !options.backupDir) {
    console.error('Error: Must specify --backup-file or --backup-dir');
    process.exit(1);
  }

  restore
    .run(options)
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default SupabaseRestore;
