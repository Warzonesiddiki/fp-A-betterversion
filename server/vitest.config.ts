import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Each test file runs against its own fresh real-SQLite database; the
    // per-worker path is assigned in vitest.setup.ts (parallel files must not
    // share a DB file). Files live under server/data (gitignored).
    setupFiles: ['./vitest.setup.ts'],
    // Deliberate exclusion (kept as of 2026-08-11, see vitest.native.config.ts
    // and the reasoning ledger): AuditService.test.ts and
    // accountLockout.test.ts require the better-sqlite3 NATIVE binding, which
    // is not available in every CI environment without the documented
    // `npm rebuild better-sqlite3` bootstrap step. The default `npm test`
    // therefore stays portable; `npm run test:native-db` (vitest.native.config.ts)
    // runs ALL 15 files including those two for full coverage. Full coverage
    // must never be claimed from the default run alone.
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/services/AuditService.test.ts',
      'src/middleware/accountLockout.test.ts',
    ],
  },
});
