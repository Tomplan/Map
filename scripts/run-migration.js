// Script to run a SQL migration file using psql and the backup configuration
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from scripts/backup/.env
const backupEnvPath = path.join(rootDir, 'scripts/backup/.env');
if (fs.existsSync(backupEnvPath)) {
  config({ path: backupEnvPath });
} else {
  console.warn('Warning: scripts/backup/.env not found. Relying on process.env.');
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <path-to-sql-file>');
  process.exit(1);
}

const dbConfig = {
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT || 5432,
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
};

if (!dbConfig.host || !dbConfig.password) {
  console.error('Error: Database credentials not found in scripts/backup/.env');
  console.error('Please ensure SUPABASE_DB_HOST and SUPABASE_DB_PASSWORD are set.');
  process.exit(1);
}

const connectionString = `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

console.log(`Running migration: ${migrationFile}...`);

// Use PGPASSWORD env var to avoid password in command line arguments (safer)
const env = { ...process.env, PGPASSWORD: dbConfig.password };

// Construct command
// psql -h host -p port -U user -d database -f file
const cmd = `psql -h "${dbConfig.host}" -p "${dbConfig.port}" -U "${dbConfig.user}" -d "${dbConfig.database}" -f "${migrationFile}"`;

const child = exec(cmd, { env }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration failed: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
  console.log('Migration completed successfully.');
});
