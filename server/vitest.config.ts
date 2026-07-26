import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/services/AuditService.test.ts',
      'src/middleware/accountLockout.test.ts',
    ],
  },
});
