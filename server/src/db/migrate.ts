import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';
import { ensureEntityAccessTable } from '../middleware/entityAuth.js';
import { createAuditTables } from './auditSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../src-tauri/migrations');

function runSqlFile(filePath: string): void {
  const sql = fs.readFileSync(filePath, 'utf-8');
  db.exec(sql);
}

function createAuthTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Viewer',
      entity_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_entity ON users(entity_id);

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip_address TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at);
  `);
}

export function runMigrations(): void {
  console.log('[migrate] Running database migrations...');

  // Run existing Tauri migration files if they exist
  const migrationFiles = ['001_initial_schema.sql', '002_cube_schema.sql'];

  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`[migrate] Applying ${file}...`);
      runSqlFile(filePath);
    } else {
      console.warn(`[migrate] Migration file not found: ${file} (skipping)`);
    }
  }

  // Create auth-specific tables
  console.log('[migrate] Creating auth tables...');
  createAuthTables();

  // Create entity access control table and seed existing relationships
  console.log('[migrate] Creating entity access tables...');
  ensureEntityAccessTable();

  // Create audit logging tables
  console.log('[migrate] Creating audit tables...');
  createAuditTables();

  console.log('[migrate] All migrations complete.');
}
