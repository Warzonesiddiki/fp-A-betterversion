# 02 — Architecture (as built, measured 2026-10-15)

## Stack and pinned versions

From `package.json` (39 runtime deps, 38 dev deps — far above the ≤ 12 the
reference method recommends; do not add more without deleting one).

| Layer         | Library                                                                        | Version                                             |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| UI            | react / react-dom                                                              | 19.2.8 (exact)                                      |
| Routing       | react-router-dom                                                               | 7.18.2 (exact; `react-router` overridden to ^8.3.0) |
| Build         | vite                                                                           | 8 (dev dep)                                         |
| Language      | typescript (strict)                                                            | 5.9 (dev dep)                                       |
| Styling       | tailwindcss 4, `clsx`, `tailwind-merge`                                        | —                                                   |
| State         | zustand ^5.0.13 + immer + `persist` + `subscribeWithSelector`                  | —                                                   |
| Money         | decimal.js ^10.6.0 (only via `src/utils/money.ts`)                             | —                                                   |
| Grid / charts | ag-grid-community/react ^35, recharts ^3                                       | —                                                   |
| Files         | exceljs ^4.4, jspdf ^4 + autotable, file-saver                                 | —                                                   |
| Desktop       | @tauri-apps/api ^2.11, plugin-sql, plugin-notification, plugin-global-shortcut | —                                                   |
| Local DB      | sql.js ^1.14 (browser fallback), Tauri SQL plugin (desktop)                    | —                                                   |
| Validation    | zod ^4                                                                         | —                                                   |
| i18n          | i18next ^26, react-i18next ^17                                                 | —                                                   |
| Telemetry     | @sentry/react ^10 (**off unless `VITE_SENTRY_DSN` set**)                       | —                                                   |
| Tests         | vitest 4 (jsdom, threads pool), @testing-library, playwright                   | —                                                   |

Node 22 is what the sandbox and CI use. No `engines` field is declared.

## Entry points and runtime gate

```text
index.html → src/main.tsx → src/App.tsx
```

- `App.tsx` declares **206 `<Route>`s**, **182 via `React.lazy`**, and a
  runtime gate: if `isTauriRuntime()` is false (`'__TAURI_INTERNALS__' in
window`), the app calls `alert()` and renders `null`. A plain browser
  therefore shows nothing — this is by design (desktop-only) and is why
  `npm run dev` on :5173 is only useful with the Tauri shell or with tests.
- Dev server: Vite on port 5173, `strictPort: true`; `/api` is proxied to the
  Express server on :3001 when that is running.
- Path alias: `@/` → `src/`. Two build-time aliases stub
  `@tauri-apps/plugin-global-shortcut` and `canvg`
  (`src/test/__mocks__/*`) — tests and bundles both see the stubs.

## Layers and the dependency direction that must hold

```text
pages / components  ──►  hooks  ──►  store  ──►  engines  ──►  utils (money, clock, csv…)
        │                            │
        └──────────► services ◄──────┘        services: import/export/connectors/sdk
                                              (may call engines and utils; never pages)
types/index.ts is imported by everyone and imports nothing from the app.
```

Rules:

- **UI never computes money.** Pages format values; engines/stores compute
  them via `@/utils/money`. (`decimal.js` display-only in components.)
- **Engines are pure.** No store imports, no DOM, no I/O, no clock — inputs in,
  outputs out. `src/engines/` modules that import a store are defects.
- **Exports consume calculation objects; they never recompute.**
- **No circular imports** across these layers. `npm run architecture:guardrails`
  exists but is not in `npm run check`; run it when you touch imports.
- **One storage engine per environment.** `masterStorage` chooses Tauri SQL
  (desktop) or sql.js/IndexedDB (browser/test). Do not add another.

## Directory map (counts measured; use the scripts to refresh)

| Path                                                                     | What                                                                                                                                                                 | Count                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `src/pages/<domain>/`                                                    | route pages; colocated `*.test.tsx`, `*.deep.test.tsx`, `*.a11y.test.tsx`, `*.money.test.ts`                                                                         | 216 page files                         |
| `src/components/ui/`                                                     | primitives, barrel `index.ts`; six "migrated" primitives are lint-locked to semantic tokens                                                                          | 122                                    |
| `src/components/<domain>/`                                               | domain components (data, budget, reports, consolidation, …)                                                                                                          | —                                      |
| `src/store/`                                                             | Zustand stores (`persist` + `immer` + `subscribeWithSelector`), 42 persisted                                                                                         | 46                                     |
| `src/engines/`                                                           | calculation modules + `manifest.generated` + `__tests__/` (financial oracles)                                                                                        | 182 modules (95 reachable, 87 orphans) |
| `src/services/`                                                          | `GLImportService`, `ImportPipeline` (both unwired), `import/importProvenance.ts` (wired), export engines, `api-integration/*Connector.ts` (unwired), `commandClient` | 66 files                               |
| `src/sdk/`                                                               | `FpaClient`, `gl/GlCommitNamespace` — the only client code that talks to `server/`; refuses to call anything unless `VITE_API_URL` is set                            | —                                      |
| `src/hooks/`                                                             | `use*` hooks incl. `useCurrencyFormatter`                                                                                                                            | 47                                     |
| `src/workers/`                                                           | Monte Carlo, consolidation, formula, storage workers                                                                                                                 | 9                                      |
| `src/utils/`                                                             | `money.ts`, `clock.ts`, `sha256.ts`, `csv.ts`, `parseFinancialAmount.ts`, `parseImportDate.ts`, storage adapters, `rbacEnforcer.ts`, `logger.ts`                     | —                                      |
| `src/types/index.ts`                                                     | all domain and store-state types                                                                                                                                     | 1 file                                 |
| `src/domain/`                                                            | `chartOfAccounts.ts`, `persistenceAuthority.ts` (which store owns which fact)                                                                                        | —                                      |
| `src/test/`                                                              | `setup.ts` (global mocks), `__mocks__/`                                                                                                                              | —                                      |
| `src/plugins/`, `src/templates/`, `src/i18n/`, `src/theme/`, `src/wasm/` | out-of-spine surface                                                                                                                                                 | —                                      |
| `src-tauri/`                                                             | Rust shell, `tauri.conf.json`, `migrations/` (35 tables, **unused by the app**)                                                                                      | —                                      |
| `server/`                                                                | Express + SQLite; own `package.json`, 32 test files                                                                                                                  | —                                      |
| `scripts/`                                                               | all gates/generators (see 05)                                                                                                                                        | —                                      |
| `e2e/`, `tests/`                                                         | Playwright (shims Tauri; does not exercise the real shell)                                                                                                           | —                                      |

## State management pattern (required shape)

```ts
export const useXStore = create<XState>()(
  subscribeWithSelector(
    // outermost: fine-grained subscriptions
    persist(
      immer((set, get) => ({
        /* state + actions */
      })),
      {
        name: 'x-store', // key in masterStorage
        storage: masterStorage, // never localStorage directly
        version: N,
        migrate, // bump + migrate on shape change
        partialize: (s) => ({
          /* persisted subset only */
        }),
      }
    )
  )
);
```

- Financial actions are wrapped with `enforce(Permissions.X, 'name', fn)`
  from `src/utils/rbacEnforcer.ts`; tests set an authenticated `authStore`
  user with the needed permissions (see 06).
- Every persisted store must appear in `docs/architecture/PERSISTENCE_MAP.md`
  with a classification; `npm run persistence:map` fails otherwise.
- `src/domain/persistenceAuthority.ts` declares which store is authoritative
  for which fact. Do not duplicate a fact across stores.

## Persistence truth

- `masterStorage` (`src/utils/masterStorage.ts`) serialises **whole store
  state** as AES-GCM-encrypted JSON into a key-value table
  `stores(id, value)`; chunked for large payloads (`chunkedStorage.ts`).
- The relational schema in `src-tauri/migrations/` (accounts, gl_entries,
  budgets, …, 35 tables) is **not written by the client**. The optional
  `server/` applies those same migrations plus ~10 in-code tables (auth,
  audit) and does query `gl_entries`. `npm run schema:equality` checks only
  the one table defined in both places (`audit_trail`). Choosing a store of
  record is **DEC-005**.
- Consequence for agents: in the desktop app there is no SQL to query GL
  entries; all reads go through Zustand selectors over in-memory arrays. Design features
  accordingly until DEC-005 is made.

## Server (`server/`)

Express + better-sqlite3-style SQLite, JWT auth, RBAC, tenancy, period-close
and GL commit routes, audit logging. **Status:** complete enough to run and
test (323 tests green) but: not bundled with the desktop app; only
`src/sdk/gl/GlCommitNamespace` targets it, and it is inert without
`VITE_API_URL`. Its role is **DEC-004 / P1-13**. Do not add client calls to
it before that decision.

## Configuration surface (`import.meta.env`)

| Variable                                                                                   | Effect                                                | Default                         |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------- |
| `VITE_API_URL`                                                                             | enables the SDK/REST origin (and `/api` proxy target) | unset → `ApiNotConfiguredError` |
| `VITE_WS_URL`                                                                              | realtime endpoint                                     | unset                           |
| `VITE_USE_MOCK_AUTH`                                                                       | dev/test mock session; **refused when `PROD`**        | unset; vitest sets it           |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_RELEASE`                                                   | Sentry init                                           | unset → skipped                 |
| `VITE_LLM_EGRESS_ENABLED`, `VITE_LLM_EGRESS_ALLOWED_HOSTS`, `VITE_LLM_EGRESS_DENIED_HOSTS` | AI egress gate                                        | disabled                        |
| `VITE_NIM_BASE_URL`, `VITE_NIM_API_KEY_*`                                                  | AI provider                                           | unset                           |
| `VITE_CONTROL_PLANE_URL`, `VITE_ENABLE_CONTROL_PLANE`                                      | command client                                        | off                             |

There is no `.env` in the repository by design; `.env.example` documents the
above. Never commit real values; the pre-commit hook scans added lines for
key material.

## Build and bundle

`npm run build` = `tsc --noEmit && eslint --max-warnings 0 && vite build`.
Manual chunks split vendors (react, ag-grid, recharts, exceljs, jspdf, sql.js,
ai). `npm run bundle-check` enforces the size budget from `scripts/bundle-check.js`:
main entry chunk ≤ 150 KB gzip, total JS ≤ 2048 KB gzip (2005 KB measured
2026-08-23), lazy vendor chunks ≤ 300 KB gzip each; it warns at 90 % of each
cap. Re-measure after `vite build` before quoting a number.

## Desktop shell

Tauri 2. Rust is **not** available in the Arena sandbox: `src-tauri` cannot
be compiled or tested here; treat anything that depends on it as
`NATIVE-UNVERIFIED` in handovers. Signing key rotation is documented in
`docs/TAURI_PUBKEY_ROTATION.md`.
