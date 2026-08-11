import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Server test isolation (real SQLite):
 *
 * Each test file runs against its own fresh, disposable database:
 *  - the path is per-worker (VITEST_WORKER_ID), because parallel files must
 *    never share a DB file (one file's cleanup would delete another's live
 *    database);
 *  - the file (plus WAL sidecars) is removed before each test file loads, so
 *    `connection.ts` creates and migrates a clean database per file.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerId = process.env.VITEST_WORKER_ID ?? '0';
const TEST_DB = path.join(__dirname, 'data', `test-finplan-${workerId}.db`);

process.env.FINPLAN_DB_PATH = TEST_DB;

for (const suffix of ['', '-shm', '-wal']) {
  try {
    fs.rmSync(TEST_DB + suffix, { force: true });
  } catch {
    // Best-effort cleanup; connection.ts creates the file on demand.
  }
}
const dir = path.dirname(TEST_DB);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
