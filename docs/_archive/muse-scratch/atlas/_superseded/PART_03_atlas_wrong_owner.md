# Part 3 — Technical Architecture & Build Standards

**Status:** DRAFT v0.1
**Owner:** Atlas
**Last updated:** 2026-06-15
**Cross-refs:** Part 12 (Stores), Part 18 (Performance), Part 20 (Deployment), Part 67 (Tauri), Part 68 (Web Workers), Part 69 (PWA), Part 82 (Build Sequence), Part 83 (TypeScript), Part 84 (Routing), Part 109 (CI/CD)
**Inputs from audits:** INFRASTRUCTURE_READINESS.md (6-dim) — Vite 7.1.2 vs target Vite 8; Tauri 2.10.0 ✓; PWA via vite-plugin-pwa 1.0.2 ✓; CI matrix (tsc→lint→test→build→bundle-check) ✓; Husky pre-push 4-gate ✓; bundle-check 150KB/2MB ✓; 2266 TSC errors as of v4 snapshot.

---

## Summary

This Part specifies the **canonical technical stack, build pipeline, source layout, and coding standards** for FinPlan Pro. The app is a Tauri v2 desktop wrapper around a Vite-built React 19 + TypeScript SPA that is **also** installable as a PWA. The build must produce three artifacts: (1) a web bundle for the PWA, (2) a Tauri native bundle (per OS), and (3) source maps uploaded to Sentry. The TypeScript strict compiler is the source of truth for correctness; ESLint flat-config enforces style; Vitest owns unit logic; Playwright owns E2E. Bundle-size budgets (main chunk ≤ 150 KB gz; total JS ≤ 2 MB gz) are **enforced as build gates**, not advisory warnings. Husky pre-push runs the 4-gate check before any code leaves the dev's machine.

---

## Sections

### 1. Stack Pinning (canonical versions)

| Layer           | Technology                          | Pinned Version                       | Source of truth                            |
| --------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------ |
| Package manager | pnpm                                | 9.x                                  | `package.json#packageManager`              |
| Runtime         | Node.js                             | 20.x LTS                             | `.nvmrc` + `engines.node`                  |
| Build tool      | Vite                                | **7.1.2** (target upgrade to Vite 8) | `vite.config.ts`                           |
| UI framework    | React                               | 19.0.0                               | `package.json`                             |
| Language        | TypeScript                          | 5.x strict                           | `tsconfig.json`                            |
| Desktop shell   | Tauri                               | 2.10.0                               | `src-tauri/Cargo.toml`                     |
| Routing         | React Router                        | 7.x                                  | `src/router/`                              |
| State           | Zustand + Dexie                     | 5.x / 4.x                            | `src/stores/`, `src/db/`                   |
| Data grid       | AG Grid Community                   | 33.x                                 | `src/components/grids/`                    |
| Charts          | Recharts                            | 2.x                                  | `src/components/charts/`                   |
| Forms           | React Hook Form + Zod               | 7.x / 3.x                            | `src/forms/`                               |
| PWA             | vite-plugin-pwa + workbox-window    | 1.0.2 / 7.3.0                        | `vite.config.ts`                           |
| Workers         | comlink + dedicated workers         | 4.x                                  | `src/workers/`                             |
| Crypto          | WebCrypto + libsodium-wrappers      | — / 0.7.x                            | `src/lib/crypto/`                          |
| Error tracking  | @sentry/react + @sentry/vite-plugin | 9.x / 4.4.0                          | `src/lib/sentry.ts`                        |
| Testing         | Vitest + Playwright                 | 2.x / 1.49.x                         | `vitest.config.ts`, `playwright.config.ts` |
| Lint/format     | ESLint flat + Prettier              | 9.x / 3.x                            | `eslint.config.js`, `.prettierrc`          |
| Pre-push        | Husky + lint-staged                 | 9.x / 15.x                           | `.husky/pre-push`                          |

**Rule:** every row in this table appears in `package.json#dependencies` or `devDependencies`. No undeclared runtime imports are allowed (enforced by a custom `scripts/check-deps.mjs`).

### 2. Source layout (canonical)

```
fpa/
├── index.html                  # Vite entry, mounts #root
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json               # base strict config
├── tsconfig.node.json          # for vite.config.ts, scripts/
├── vite.config.ts              # Vite + PWA + Sentry + bundle analyzer
├── vitest.config.ts            # Vitest setup (jsdom + happy-dom)
├── playwright.config.ts        # E2E config
├── eslint.config.js            # flat config (TS + React + a11y)
├── .prettierrc                 # 2-space, single-quote, semi
├── .lintstagedrc.json          # prettier + eslint on staged
├── .husky/                     # pre-commit, pre-push hooks
├── .github/workflows/          # CI: tsc, lint, test, build, deploy, release
├── src/
│   ├── main.tsx                # React root + Sentry init + Router
│   ├── App.tsx                 # layout shell
│   ├── router/                 # Part 84
│   ├── stores/                 # Part 12 (Zustand slices)
│   ├── db/                     # Part 12 (Dexie schemas, migrations)
│   ├── workers/                # Part 68 (calc, monte-carlo, importers)
│   ├── lib/                    # pure utilities (crypto, formatters, formulas)
│   ├── components/             # presentational + container split
│   ├── features/               # domain modules (budget, forecast, scenario, report)
│   ├── pages/                  # route-level components
│   ├── hooks/                  # custom React hooks
│   ├── i18n/                   # en-US baseline, extensible
│   ├── theme/                  # design tokens, MUI / shadcn primitives
│   ├── pwa/                    # service worker registration, update prompt
│   └── sentry/                 # Sentry init, release tagging
├── src-tauri/
│   ├── tauri.conf.json         # v2 schema (verified 2.10.0)
│   ├── Cargo.toml
│   ├── src/main.rs             # bootstrap
│   ├── src/commands/           # IPC commands callable from JS
│   ├── src/ipc/                # Part 67 — command allowlist, sandbox
│   └── icons/                  # 32×32, 128×128, 128x128@2x, icon.icns, icon.ico
├── public/
│   ├── robots.txt
│   └── favicon.svg
├── dist/                       # Vite build output (gitignored)
├── tests/
│   ├── unit/                   # Vitest specs (mirror src/)
│   └── e2e/                    # Playwright specs (one per user journey)
├── scripts/                    # Node ESM utilities (bundle-check, sentry, etc.)
├── docs/
│   ├── drafts/<muse>/          # work-in-progress Part drafts
│   └── audits/                 # frozen 6-dim audits from each Muse
├── .claude/                    # Muse skills + telemetry (per-muse dir)
├── PLAN.md
├── AGENTS.md
└── PROJECT_INDEX.md
```

### 3. TypeScript configuration (canonical)

`tsconfig.json` MUST set:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable", "WebWorker"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"],
    },
    "baseUrl": ".",
  },
  "include": ["src", "tests/unit"],
  "exclude": ["node_modules", "dist", "src-tauri"],
}
```

**Rules**

- `any` is forbidden outside `*.d.ts` shims. Use `unknown` and narrow.
- Type-only imports MUST use `import type { ... }` (enforced by `verbatimModuleSyntax`).
- Public API of a module is its exported named bindings; default exports are forbidden except for React components and route elements.
- All cross-module types live in `src/lib/types/` and are imported by path alias `@/lib/types/...`.

### 4. Vite configuration (canonical)

`vite.config.ts` MUST include (in this order):

1. `defineConfig({ plugins: [react(), sentryVitePlugin({...}), VitePWA({...})] })`
2. `resolve.alias['@'] = '/src'`
3. `build.target = 'es2022'`
4. `build.sourcemap = true` (for Sentry upload)
5. `build.rollupOptions.output.manualChunks` with the following split:
   - `react-vendor` (react, react-dom, react-router)
   - `ag-grid` (ag-grid-community + theme)
   - `charts` (recharts, d3-\*)
   - `forms` (react-hook-form, zod, @hookform/resolvers)
   - `db` (dexie, dexie-react-hooks)
   - `crypto` (libsodium-wrappers)
   - `sentry` (@sentry/react, @sentry/browser)
   - `workbox` (workbox-window, register)
6. `worker.format = 'es'`
7. `optimizeDeps.exclude = ['libsodium-wrappers']` (it has its own WASM)
8. `server.port = 5173`, `server.strictPort = true`
9. `preview.port = 4173`
10. `test` block (delegated to `vitest.config.ts` via mergeConfig)

`VitePWA` configuration:

- `registerType: 'autoUpdate'`
- `strategies: 'generateSW'` with `workbox.runtimeCaching` rules for: `/api/(.*)` (NetworkFirst, 5min), `/static/(.*)` (CacheFirst, 30d), fonts (CacheFirst, 1y), images (StaleWhileRevalidate, 30d).
- `manifest`: name="FinPlan Pro", short_name="FinPlan", display="standalone", start_url="/", theme_color="#0F62FE", background_color="#FFFFFF", icons=192, 512, maskable 512.

### 5. ESLint flat config (canonical)

`eslint.config.js` extends:

- `@eslint/js` (recommended)
- `typescript-eslint` `strict-type-checked` + `stylistic-type-checked`
- `eslint-plugin-react` + `react-hooks` (latest)
- `eslint-plugin-jsx-a11y` (recommended)
- `eslint-plugin-import` (with `import/no-cycle` error)
- `eslint-plugin-boundaries` (enforces `src/features/*` may import only from `@/lib`, `@/stores`, `@/components/ui`)

Custom rule: `no-restricted-syntax` forbids `any` in type positions and `// @ts-ignore` (use `// @ts-expect-error` with a comment).

### 6. Prettier config (canonical)

`.prettierrc`:

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "all",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

`.prettierignore`: `dist`, `node_modules`, `src-tauri/target`, `coverage`, `pnpm-lock.yaml`, `*.gen.ts`.

### 7. Test layout & rules

- **Unit (Vitest):** `tests/unit/**/*.spec.ts` mirrors `src/**`. Run with `--coverage` threshold: lines 80%, branches 75%, functions 80%, statements 80% (currently 1043 tests pass per v4 snapshot).
- **E2E (Playwright):** `tests/e2e/**/*.spec.ts`, one file per user journey (8 journeys — see Part 121). Chromium desktop is the primary; webkit + firefox are smoke-only.
- **Visual (Playwright snapshots):** `tests/visual/**`, run on label `visual` only.
- **Test isolation:** every test file MUST clean Dexie DB and reset Zustand stores in `beforeEach` via a helper in `tests/helpers/reset.ts`.

### 8. Lint-staged & pre-push rules

`.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": ["eslint --max-warnings=0 --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

`.husky/pre-push` MUST run, in order, with **fail-fast on first gate**:

1. `pnpm tsc --noEmit` (full strict type-check)
2. `pnpm eslint . --max-warnings=0`
3. `pnpm vitest run --reporter=dot --bail=1 tests/unit/core tests/unit/calc tests/unit/stores` (focused subset for speed; full suite runs in CI)
4. `pnpm vite build` (catches Vite-specific build errors pre-push)

`pre-commit` runs only `lint-staged` for staged files.

### 9. Bundle-size enforcement (canonical)

`scripts/bundle-check.js` runs after `vite build`:

| Limit                             | Constant in script      | Value       | Failure action    |
| --------------------------------- | ----------------------- | ----------- | ----------------- |
| Main chunk (largest single gz JS) | `MAIN_CHUNK_LIMIT_KB`   | 150         | `process.exit(1)` |
| Total JS (sum of all gz JS)       | `TOTAL_JS_LIMIT_KB`     | 2048 (2 MB) | `process.exit(1)` |
| Total CSS gz                      | `CSS_LIMIT_KB`          | 60          | `process.exit(1)` |
| Largest single image              | `IMG_LIMIT_KB`          | 250         | warn only         |
| Vendor chunk (largest)            | `VENDOR_CHUNK_LIMIT_KB` | 600         | `process.exit(1)` |

The script also writes `dist/bundle-report.json` with per-chunk sizes (in & out) for CI artifact upload.

CI wiring:

- `.github/workflows/build.yml` runs `pnpm build && pnpm bundle-check` and uploads `dist/` and `dist/bundle-report.json` as artifacts.
- The workflow **fails** the build if either limit is exceeded.

### 10. Environment variables (canonical)

Loaded via Vite's `import.meta.env` (prefixed `VITE_`):

| Var                   | Purpose                          | Required  | Default           |
| --------------------- | -------------------------------- | --------- | ----------------- |
| `VITE_SENTRY_DSN`     | Sentry DSN (browser)             | prod only | empty in dev      |
| `VITE_SENTRY_RELEASE` | Release tag injected at build    | prod only | git SHA           |
| `VITE_APP_VERSION`    | Displayed in About               | yes       | from package.json |
| `VITE_PWA_ENABLED`    | Toggle service worker            | yes       | `true`            |
| `VITE_API_BASE_URL`   | Backend base (Tauri HTTP plugin) | yes       | `/api`            |
| `VITE_TAURI_DEV`      | Tells web bundle it's in Tauri   | yes       | `false`           |

Secrets (Tauri-specific) live in `src-tauri/.env` and are loaded by Cargo at build; never inlined.

### 11. Build & dev scripts (canonical)

`package.json#scripts`:

```json
{
  "dev": "vite",
  "dev:tauri": "tauri dev",
  "build": "tsc -b && vite build",
  "build:tauri": "tauri build",
  "build:analyze": "ANALYZE=true vite build",
  "preview": "vite preview",
  "lint": "eslint . --max-warnings=0",
  "lint:fix": "eslint . --max-warnings=0 --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "tsc": "tsc --noEmit",
  "tsc:watch": "tsc --noEmit --watch",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "bundle-check": "node scripts/bundle-check.js",
  "check-deps": "node scripts/check-deps.mjs",
  "sentry:sourcemaps": "node scripts/sentry-upload-sourcemaps.mjs",
  "verify": "node scripts/verify-build.mjs",
  "prepare": "husky"
}
```

### 12. Code-generation standards

- **Path alias** `@/*` is mandatory for any `src/` import crossing a folder boundary.
- **Folder-per-feature**: `src/features/<name>/` containing `components/`, `hooks/`, `lib/`, `types.ts`, `index.ts` (barrel). Cross-feature imports go through the barrel only.
- **Barrel files** are auto-generated by `scripts/gen-barrels.mjs`; do not hand-write.
- **State**: every Zustand store has a `*.spec.ts` colocated in `tests/unit/stores/`.
- **Workers**: every worker has a `*.contract.ts` declaring its `Comlink.expose` API; types are shared via `import type`.
- **Errors**: throw `AppError extends Error` with a `code: string`; Sentry tags by `code`.

### 13. File-by-file build order (canonical)

Build proceeds in this order (used by `tsc -b` and Vite's module graph):

1. `src/lib/types/**` — pure types, no runtime
2. `src/lib/constants/**` — pure constants
3. `src/lib/utils/**` — pure functions
4. `src/db/schemas/**` — Dexie schema classes
5. `src/stores/**` — Zustand slices
6. `src/workers/**` — Web Workers (separate entry, `?worker` import)
7. `src/features/**` — domain modules
8. `src/components/ui/**` — primitives
9. `src/components/**` — composed components
10. `src/pages/**` — route components
11. `src/router/**` — route table
12. `src/App.tsx`, `src/main.tsx` — root

`scripts/verify-build.mjs` walks the dist graph post-build and asserts this order is preserved in chunk IDs.

### 14. Tauri integration (canonical)

- `tauri.conf.json` schema = v2; `app.windows[0]` = single window 1440×900, min 1024×640.
- IPC commands are allowlisted in `src-tauri/src/commands/mod.rs`; every JS-side invocation MUST go through `src/lib/tauri/bridge.ts` (typed wrapper around `@tauri-apps/api/core#invoke`).
- File system access only via `tauri-plugin-fs` with explicit allow-list of user-chosen paths (no wildcards).
- No `shell-execute` or `child-process` plugins are loaded.
- The Tauri binary embeds the Vite-built `dist/` via `frontendDist` in `tauri.conf.json`.

### 15. Open Questions / Gaps

1. **Vite 8 upgrade** — current pin is 7.1.2. Migration plan + breaking-change list to be drafted as a follow-up Part. (Atlas will own.)
2. **TypeScript 5.6+** adoption (`--noUncheckedSideEffectImports`) — TBD.
3. **`vite-plugin-pwa` 1.x is pre-release** — confirm a stable 1.x line is published before 1.0 GA.
4. **Workbox `injectManifest` vs `generateSW`** — current spec uses `generateSW`; revisit if the team needs more SW control.
5. **CSS budget 60 KB gz** — is this the right number once we add theming? Re-benchmark with full theme loaded.

### 16. Sign-off

**Status:** TENTATIVE — pending Vite 8 upgrade plan and Strategos synthesis of all 4 INFRA Parts.
