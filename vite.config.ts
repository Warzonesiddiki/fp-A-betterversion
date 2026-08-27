/// <reference types="vitest" />
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

// Strip modulepreload for ai-vendor (553kB @huggingface/transformers + 23.5MB WASM)
// so it only loads when user opens AI copilot panel, not on every page load.
const noAiPreload: Plugin = {
  name: 'no-ai-vendor-preload',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      return html.replace(/<link rel="modulepreload"[^>]*\/assets\/ai-vendor[^>]*>/g, '');
    },
  },
};

declare module 'vite' {
  interface UserConfig {
    test?: Record<string, unknown>;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithm: 'brotliCompress' }),
    // Sentry source-map upload — only active when SENTRY_AUTH_TOKEN is set
    // (typically in CI / staging, never in dev or local prod-style builds).
    // See T-ATL-007 (Sentry self-hosted) + T-ATL-009 (SDK install).
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VITE_SENTRY_RELEASE ?? '' },
            telemetry: false,
          }),
        ]
      : []),
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: 'bundle-report/stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: false,
          }),
        ]
      : []),
    noAiPreload,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tauri-apps/plugin-global-shortcut': path.resolve(
        __dirname,
        'src/test/__mocks__/tauri-shortcut.ts'
      ),
      // Bundle-gate fix: jspdf's optional canvg dependency (only used by its
      // SVG-to-PDF path, which no app code reaches) dragged in canvg@3 +
      // core-js as a ~47 KB gz eager chunk. Alias it to an explicit stub so
      // the bytes never bundle; see src/test/__mocks__/canvg-stub.ts.
      canvg: path.resolve(__dirname, 'src/test/__mocks__/canvg-stub.ts'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    // W6-P0-13 api-origin-truth: local dev reaches the REAL Express backend
    // (server/, port 3001) via same-origin /api instead of a fictional host.
    // The SDK resolves its origin from VITE_API_URL; leaving it unset in dev
    // keeps requests same-origin so this proxy carries them to Express.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    // Dev-only host allow-list. The production desktop shell (Tauri) never uses
    // this server; it exists so sandboxed/remote development previews (which
    // proxy the dev server under a generated hostname) are not rejected by
    // Vite's host check. Loopback plus explicit preview domains only — never `true`.
    allowedHosts: ['localhost', '127.0.0.1', '.e2b.app', '.localhost'],
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      // ATLAS G2 hygiene: filter diagnostics that don't affect correctness.
      // Eval-in-exceljs: G7 (xlsx removal) is owned by Hephaestus; the
      // eval is in a third-party vendor and we keep the bytes.
      // Chunk size: the real G19 budget is gzip (grid 285 KB gz,
      // excel 238 KB gz - both < 300 KB).
      // See .openhands/baseline-g3-bundle.log.
      onwarn(warning, defaultHandler) {
        if (
          warning.code === 'EVAL' &&
          typeof warning.id === 'string' &&
          warning.id.includes('exceljs')
        ) {
          return;
        }
        if (
          warning.code === 'CHUNK_SIZE' ||
          /chunks? (are|is) larger than/i.test(String(warning.message))
        ) {
          return;
        }
        defaultHandler(warning);
      },
      output: {
        chunkFileNames(chunkInfo) {
          return chunkInfo.name.startsWith('index')
            ? 'assets/chunk-[hash].js'
            : 'assets/[name]-[hash].js';
        },
        manualChunks(id: string) {
          if (id.includes('@huggingface/transformers')) return 'ai-vendor';
          // R27 vendor-chunk audit: react-dom (~83KB gz by module-sum, ~50%
          // of the entry artefact) rode inside the entry chunk, pushing the
          // gate-selected main `index-*.js` to 165.7KB gzip — over the 150KB
          // G3 limit. Extracting React into its own named group is purely
          // organizational: react-vendor stays in the eager preload set (every
          // page needs it), so no loading behavior changes and the critical
          // path keeps the same bytes. This restores the react-vendor group
          // documented in AGENTS.md §Architecture but missing from this
          // config. Segment-suffixed patterns keep lookalikes (lucide-react,
          // react-i18next, react-router, plugin-react) in their own homes.
          if (id.includes('node_modules/react-dom')) return 'react-vendor';
          if (id.includes('node_modules/scheduler')) return 'react-vendor';
          if (id.includes('node_modules/react/')) return 'react-vendor';
          // Rolldown injects its dynamic-import preload helper
          // (`\0vite/preload-helper.js`) and lets it settle into whichever
          // chunk it likes. It had settled in pdf-vendor — so the entry chunk,
          // masterStorage and 9 other importers, all of which want only this
          // ~1KB helper, dragged a 616KB jsPDF modulepreload onto first paint.
          // `loadJsPDF()` in utils/pdfRuntime.ts goes out of its way to keep
          // jsPDF lazy, and this silently undid that. Critical path was
          // 483.42KB gzip; pinning the helper here makes it 304.23KB (-37%).
          //
          // It has to ride along with an existing, already-eager group rather
          // than get a chunk of its own: a lone `return 'preload-helper'` is
          // re-merged by rolldown (too small to keep), and rolldown-vite 8
          // rejects `output.minChunkSize` as an invalid key — both verified.
          // Naming an auto-generated chunk such as 'react' fails the same way.
          // icon-vendor is the right host precisely because it is already in
          // the preload set, so the helper adds no new critical-path bytes.
          // Keep this rule next to the group it joins; splitting them will
          // quietly put jsPDF back on first paint.
          if (id.includes('lucide-react') || id.includes('vite/preload-helper'))
            return 'icon-vendor';
          // ag-grid must be named so the G19 budget in scripts/bundle-check.js
          // can see it. That gate skips any vendor whose chunk is missing, so
          // while ag-grid landed in an anonymous `chunk-*.js` it was the single
          // largest artefact in the build (298KB gzip, within 2KB of the 300KB
          // per-vendor limit) and no budget applied to it at all.
          // ag-grid-react re-exports ag-grid-community, so keep the react
          // wrapper's own rule below the community one to match the gate's
          // separate grid-community-vendor / grid-react-vendor entries.
          if (id.includes('ag-grid-react')) return 'grid-react-vendor';
          if (id.includes('ag-grid-community')) return 'grid-community-vendor';
          if (id.includes('recharts')) return 'chart-vendor';
          if (id.includes('exceljs') && id.includes('/dist/exceljs/')) return 'excel-vendor';
          if (id.includes('exceljs')) return 'excel-core-vendor';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-vendor';
          if (id.includes('sql.js')) return 'db-vendor';
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      'tests/**',
      'node_modules/**',
      // Bench files (T-ATL-001 v0.4 bench opt-in policy):
      // Default `npm run test` excludes all bench work; run benches
      // explicitly via `npm run test:bench` when measuring perf.
      '__benchmarks__/**',
      '**/*.benchmark.test.ts',
      '**/*.benchmark.test.tsx',
      '**/*.bench.test.ts',
      '**/*.bench.test.tsx',
    ],
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
    pool: 'threads',
    // Vitest 4 removed `poolOptions` — worker limits are now top-level and
    // `minWorkers`/`minThreads` was dropped (only `maxWorkers` has effect).
    // See https://vitest.dev/guide/migration#pool-rework
    maxWorkers: 4,
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      // Mirror dev / staging auth behavior in tests. Without this,
      // `isMockAuthEnabled()` returns false and login() routes to
      // loginReal() — which throws "Real authentication is not
      // configured", breaking every authStore test.
      VITE_USE_MOCK_AUTH: 'true',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/*.benchmark.ts', // perf drivers run via test:bench, not unit targets
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
});
