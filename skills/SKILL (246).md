---
name: vite-best-practices
description: Vite build tool — config, plugins, HMR, optimization, dev server
user-invocable: true
---

# Vite Best Practices

Apply when: configuring Vite, optimizing builds, working with dev server.

## Config
- Use `defineConfig()` for type safety
- Environment variables: `import.meta.env.VITE_*`
- Path aliases: `resolve.alias` for `@/` imports
- Proxy API calls in dev: `server.proxy`

## Optimization
- Manual chunks for large deps: `build.rollupOptions.output.manualChunks`
- Tree shaking: use ESM imports, avoid barrel exports
- CSS code splitting: `build.cssCodeSplit: true`
- Asset optimization: `build.assetsInlineLimit`

## Plugins
- `@vitejs/plugin-react` — React support
- `vite-plugin-checker` — TypeScript checking in dev
- `vite-plugin-pwa` — PWA support
- `unplugin-auto-import` — auto import APIs

## Dev Server
- HMR is automatic for React/Vue
- Use `server.open: true` to auto-open browser
- Use `server.hmr.overlay: false` to disable error overlay
