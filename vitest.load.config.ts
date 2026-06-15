// Local vitest config for load/chaos benchmarks — overrides the project default
// which excludes __benchmarks__ from include, breaking `npm run test:bench`.
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/__benchmarks__/load/**/*.bench.test.ts'],
    exclude: ['node_modules/**', 'tests/**'],
    environment: 'jsdom',
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
