/// <reference types="vitest" />
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type UserConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'FinPlan Pro — Enterprise FP&A',
        short_name: 'FinPlan Pro',
        description:
          'Free, offline-first financial planning & analysis tool. Budgeting, forecasting, consolidation, and reporting.',
        theme_color: '#1e40af',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        categories: ['finance', 'business', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tauri-apps/plugin-global-shortcut': path.resolve(
        __dirname,
        'src/test/__mocks__/tauri-shortcut.ts'
      ),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    },
  },
  build: {
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // React core ecosystem
            if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-router'))
              return 'react-vendor';
            // State management (zustand, redux toolkit from recharts, immer)
            if (
              id.includes('zustand') ||
              id.includes('@reduxjs/toolkit') ||
              id.includes('react-redux') ||
              id.includes('/immer/') ||
              id.includes('reselect')
            )
              return 'state-vendor';
            // Forms
            if (id.includes('react-hook-form') || id.includes('zod')) return 'form-vendor';
            // AG Grid — split community from React to allow better tree-shaking
            if (id.includes('ag-grid-community')) return 'grid-community-vendor';
            if (id.includes('ag-grid-react')) return 'grid-react-vendor';
            if (id.includes('ag-grid')) return 'grid-common-vendor';
            // Recharts + victory-vendor (d3 wrapper)
            if (id.includes('recharts') || id.includes('victory-vendor')) return 'chart-vendor';
            // AI/ML
            if (id.includes('@huggingface/transformers')) return 'ai-vendor';
            // PDF generation + html2canvas (jspdf dep)
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-vendor';
            // Excel + file-saver + DOMPurify (used in data import)
            // Split exceljs core from exceljs filetype plugins
            if (id.includes('exceljs') && id.includes('/dist/exceljs/')) return 'excel-vendor';
            if (id.includes('exceljs')) return 'excel-core-vendor';
            if (id.includes('file-saver') || id.includes('dompurify') || id.includes('purify'))
              return 'excel-vendor';
            // SQL/SQLite
            if (id.includes('sql.js')) return 'db-vendor';
            // UI primitives (radix, tanstack-virtual)
            if (id.includes('@radix-ui') || id.includes('@tanstack/react-virtual'))
              return 'ui-vendor';
            // Styling utilities
            if (
              id.includes('class-variance-authority') ||
              id.includes('tailwind-merge') ||
              id.includes('clsx')
            )
              return 'style-vendor';
            // i18n
            if (id.includes('i18next')) return 'i18n-vendor';
            // Animation (only when actually imported)
            if (id.includes('framer-motion')) return 'animation-vendor';
            // Icons
            if (id.includes('lucide-react')) return 'icons-vendor';
            // Small utilities
            if (id.includes('date-fns') || id.includes('axios') || id.includes('uuid'))
              return 'utils-vendor';
          }
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/**', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
    pool: 'forks',
    maxForks: 4,
    minForks: 2,
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
