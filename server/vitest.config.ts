import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Each test file runs against its own fresh real-SQLite database; the
    // per-worker path is assigned in vitest.setup.ts (parallel files must not
    // share a DB file). Files live under server/data (gitignored).
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/services/AuditService.test.ts',
      'src/middleware/accountLockout.test.ts',
    ],
  },
});
