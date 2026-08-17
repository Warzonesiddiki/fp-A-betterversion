import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Each test file runs against its own fresh real-SQLite database; the
    // per-worker path is assigned in vitest.setup.ts (parallel files must not
    // share a DB file). Files live under server/data (gitignored).
    setupFiles: ['./vitest.setup.ts'],
    // Deliberate exclusion (see vitest.native.config.ts): AuditService.test.ts
    // and accountLockout.test.ts are the slow, native-DB-heavy suites and are
    // run by `npm run test:native-db` instead, so the default run stays fast.
    //
    // NOTE: the better-sqlite3 native binding is now a HARD requirement for
    // BOTH scripts, not an optional extra. Several suites here
    // (db/bootSchema, db/schemaReconciliation) assert real SQLite semantics —
    // PRAGMA, ALTER TABLE, legacy-table rebuild — and cannot run against the
    // in-memory mock fallback in src/db/connection.ts. Because server/.npmrc
    // sets `ignore-scripts=true`, `npm ci` installs better-sqlite3 WITHOUT
    // compiling it, so both test scripts first run
    // `scripts/ensure-native-db.mjs`, which builds the binding on demand
    // (offline, using the local Node headers) and is a no-op once present.
    //
    // Full coverage is `npm test` + `npm run test:native-db` (207 tests);
    // it must never be claimed from the default run alone.
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/services/AuditService.test.ts',
      'src/middleware/accountLockout.test.ts',
    ],
  },
});
