import { defineConfig } from 'vitest/config';

/**
 * Native-DB test configuration.
 *
 * `vitest.config.ts` deliberately EXCLUDES the two native-DB suites
 * (AuditService.test.ts, accountLockout.test.ts) because they require the
 * better-sqlite3 native binding, which is not available in every CI
 * environment. The default `npm test` therefore runs everything that can run
 * against the in-memory JS store.
 *
 * This config does NOT exclude those suites, so `npm run test:native-db`
 * (which passes their paths as a positional filter) can actually run them.
 * Before this config existed, the script filtered to those two files while
 * the base config excluded them, so vitest matched zero files and exited 1
 * with "No test files found" even where the native binding was available.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
