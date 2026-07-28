// vitest.bench.config.ts — bench-only Vitest config (T-ATL-002 v0.2)
//
// Replaces the broken `npm run test:bench` script that used unsupported
// `--include` / `--exclude` CLI flags (CACError: Unknown option).
//
// Bench opt-in policy (T-ATL-001 v0.4):
// - Default `npm run test` excludes all bench work
// - Run benches explicitly via `npm run test:bench` (this config)
//
// Usage:
//   npm run test:bench          # local run, default reporter
//   npm run test:bench:ci       # CI run, JSON output → ./bench-results.json
//
// IMPORTANT: We do NOT use `mergeConfig` here. In Vitest 4.x, mergeConfig
// concatenates arrays (union) — so baseConfig.test.include (all *.test.ts)
// would be ADDED to our bench include, defeating the whole point. We
// destructure vite.config.ts manually to REPLACE test.include/exclude.

import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  // Inherit build/resolve/alias from vite.config.ts (read-only mirror)
  ...viteConfig,
  // OVERRIDE the test block entirely — do NOT merge.
  test: {
    // ONLY bench files. Both `.bench.test.ts` and `.benchmark.test.ts`.
    include: ['src/**/*.bench.test.ts', 'src/**/*.benchmark.test.ts'],
    // Standard excludes for build artifacts / node_modules / e2e
    exclude: ['node_modules/**', 'dist/**', '.idea/**', '.git/**', '.cache/**', 'tests/e2e/**'],
    // Match the default suite's environment. Without these, benches ran in a
    // bare Node context: `window` was undefined (masterStorage → isTauri threw
    // ReferenceError) and sql.js/@huggingface/transformers were unmocked, so
    // storage and AI benches failed or hung on network fetches rather than
    // measuring anything.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Bench runs are slow; allow generous per-test timeout
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Memory-bounded concurrency (--max-old-space-size=81920 in package.json)
    pool: 'threads',
    // Vitest 4: poolOptions moved to top-level, not under test.
    // Omit here; CLI flags / defaults apply.
  },
});
