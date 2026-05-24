/// <reference types="vitest" />
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "FinPlan Pro — Enterprise FP&A",
        short_name: "FinPlan Pro",
        description:
          "Free, offline-first financial planning & analysis tool. Budgeting, forecasting, consolidation, and reporting.",
        theme_color: "#1e40af",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "landscape",
        start_url: "/",
        scope: "/",
        categories: ["finance", "business", "productivity"],
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
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
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
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
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
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
      "@": path.resolve(__dirname, "src"),
      "@tauri-apps/plugin-global-shortcut": path.resolve(__dirname, "src/test/__mocks__/tauri-shortcut.ts"),
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
            if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('react-hook-form') || id.includes('zod')) return 'form-vendor';
            if (id.includes('zustand')) return 'state-vendor';
            if (id.includes('ag-grid')) return 'grid-vendor';
            if (id.includes('recharts')) return 'chart-vendor';
            if (id.includes('@huggingface/transformers')) return 'ai-vendor';
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('date-fns') || id.includes('axios') || id.includes('uuid')) return 'utils-vendor';
            if (id.includes('class-variance-authority') || id.includes('tailwind-merge') || id.includes('clsx')) return 'cva-vendor';
            if (id.includes('i18next')) return 'i18n-vendor';
            if (id.includes('@radix-ui')) return 'radix-vendor';
            if (id.includes('@tanstack/react-virtual')) return 'tanstack-vendor';
            if (id.includes('framer-motion')) return 'animation-vendor';
            if (id.includes('lodash-es')) return 'lodash-vendor';
            if (id.includes('exceljs') || id.includes('file-saver')) return 'excel-vendor';
            if (id.includes('jspdf')) return 'pdf-vendor';
          }
        },
      }
    }
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/**', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
    pool: 'threads',
    maxThreads: 4,
    minThreads: 2,
    maxWorkers: 4,
    minWorkers: 2,
    testTimeout: 30000,
    hookTimeout: 30000,

  },
});
