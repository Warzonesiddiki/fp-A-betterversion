# 02 — Architecture (live structure; inventory source linked below)

## Stack and pinned versions

Direct dependency ranges live in `package.json`; installed versions live in
`package-lock.json`. Do not duplicate their counts here or add packages without
the standing dependency/license review.

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

Node 22 is what CI uses. No `engines` field is declared, so nothing enforces
it — and a newer runtime is not equivalent. Measured 2026-10-16 on Node
26.10.0: Node exposes a native `localStorage` accessor that breaks the three
tests which mock `Storage.prototype` (`src/utils/sqlJsStorage.test.ts` ×2,
src/utils/backupRestore.test.ts ×1), so those fail on 26 and pass on 22. See
`docs/agent/09_KNOWN_GAPS.md` (Environment caveats) before treating them as
regressions.

## Entry points and runtime gate

```text
index.html → src/main.tsx → src/App.tsx
```

- `App.tsx` owns the JSX routes and lazy modules; the generated
  [route map](../product/ROUTE_MAP.md) tracks current source. Its runtime gate: if `isTauriRuntime()` is false (`'__TAURI_INTERNALS__' in
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
  exists but is not in `npm run check`; run it when you touch imports. It
  checks source presence/keywords, not the dependency graph or absence of cycles.
- **One storage engine per environment.** `masterStorage` chooses Tauri SQL
  (desktop) or sql.js/IndexedDB (browser/test). Do not add another.

## Directory map (inventory is not hand-maintained here)

| Path                                                                     | What                                                                                                                                                                 |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/<domain>/`                                                    | route pages; colocated `*.test.tsx`, `*.deep.test.tsx`, `*.a11y.test.tsx`, `*.money.test.ts`                                                                         |
| `src/components/ui/`                                                     | primitives, barrel `index.ts`; six "migrated" primitives are lint-locked to semantic tokens                                                                          |
| `src/components/<domain>/`                                               | domain components (data, budget, reports, consolidation, …)                                                                                                          |
| `src/store/`                                                             | Zustand stores (`persist` + `immer` + `subscribeWithSelector`); authority and keys in the persistence map                                                            |
| `src/engines/`                                                           | calculation modules + `manifest.generated` + `__tests__/` (financial oracles)                                                                                        |
| `src/services/`                                                          | `GLImportService` / `ImportPipeline` (unwired), `import/importProvenance.ts` (wired), export engines, and the connector framework; `/settings/integrations` uses catalog → `integrationStore` → `glStore` for ledger-importable feeds (`ConnectorRegistry` is not on this path) |
| `src/sdk/`                                                               | `FpaClient`, `gl/GlCommitNamespace` — the only client code that talks to `server/`; refuses to call anything unless `VITE_API_URL` is set                            |
| `src/hooks/`                                                             | `use*` hooks incl. `useCurrencyFormatter`                                                                                                                            |
| `src/workers/`                                                           | Monte Carlo, consolidation, formula, storage and exact GL staging workers                                                                                            |
| `src/utils/`                                                             | `money.ts`, `clock.ts`, `sha256.ts`, `csv.ts`, `parseFinancialAmount.ts`, `parseImportDate.ts`, storage adapters, `rbacEnforcer.ts`, `logger.ts`                     |
| `src/types/index.ts`                                                     | all domain and store-state types                                                                                                                                     |
| `src/domain/`                                                            | `chartOfAccounts.ts`, `persistenceAuthority.ts` (which store owns which fact)                                                                                        |
| `src/test/`                                                              | `setup.ts` (global mocks), `__mocks__/`                                                                                                                              |
| `src/plugins/`, `src/templates/`, `src/i18n/`, `src/theme/`, `src/wasm/` | out-of-spine surface                                                                                                                                                 |
| `src-tauri/`                                                             | Rust shell, `tauri.conf.json`, `migrations/` (35 tables, **unused by the app**)                                                                                      |
| `server/`                                                                | Express + SQLite; own `package.json` and separate test suite                                                                                                         |
| `scripts/`                                                               | all gates/generators (see 05)                                                                                                                                        |
| `e2e/`, `tests/`                                                         | Playwright (shims Tauri; does not exercise the real shell)                                                                                                           |

Canonical measured engine/store/worker inventory: [README](../../README.md),
asserted by `npm run docs:verify`; `npm run engines:verify` checks the manifest.
Page/route mapping: `npm run routemap:check`. Directory roles above do not
certify module reachability, financial correctness or supported maturity.

Connector boundary (code recheck dated 2026-11-02): `/settings/integrations`
uses the catalog and `integrationStore` to import catalogued transaction feeds
to `glStore`; this UI path does not use `ConnectorRegistry`. The Dynamics
connector targets Dataverse CRM and has no GL transaction feed, so it is not a
Dynamics 365 F&O or Business Central GL connector. Provider reachability is
code-level evidence, not live-provider verification.

Universal-import boundary (reviewed 2026-11-04): `GLUploadPage` calls
`parseGLRows` and uses `glUploadStore`'s persisted header-signature mapping
profiles. `universalImportTemplate.ts` / `universalImportEngine.ts` form a
separate service path with governance tests; the current upload UI does not call
the engine's parse/auto-detect entry points. Do not treat those paths as one
integrated template workflow until callers, validation and evidence are
reconciled. The proposed target contract and sequencing are in
[`../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md); DEC-104 already accepts user-customizable universal import, but implementation/support claims remain evidence-gated.

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
  the one table defined in both places (`audit_trail`). DEC-005 accepts local
  relational SQLite as the target authority, but the current persisted Zustand
  stores remain authoritative until migration, rollback, and backup/restore
  checks pass.
- Consequence for agents: in the desktop app there is no SQL to query GL
  entries; all reads go through Zustand selectors over in-memory arrays. Design
  features accordingly until the DEC-005 migration gate is met.

## Server (`server/`)

Express + better-sqlite3-style SQLite, JWT auth, RBAC, tenancy, period-close
and GL commit routes, audit logging. It is not bundled with the desktop app and
its separate tests are not included in client-suite totals. Only
`src/sdk/gl/GlCommitNamespace` calls the GL commit API; it is inert without
`VITE_API_URL`. The auth client requires the server for first online
registration/login; DEC-014 also provides a cached-profile offline restore for
up to 30 days after enrollment. That cache currently uses device-profile
binding, not verified native OS-user binding. DEC-003/004/005 still govern
egress, desktop scope, and authority; do not add automatic network calls or a
server sidecar by inference.

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
The executable limits currently include main entry ≤ 150 KB gzip, total JS
≤ 2080 KB gzip (existing DEC-024, not the superseded 2048 KB target), and
lazy vendor chunks ≤ 300 KB gzip each. The script also checks critical-path
size and placement. Re-measure after `vite build` before quoting a result;
passing the ceiling is not completion of N7 structural reduction.

## Desktop shell

Tauri 2. Rust is **not** available in the Arena sandbox: `src-tauri` cannot
be compiled or tested here; treat anything that depends on it as
`NATIVE-UNVERIFIED` in handovers. Signing key rotation is documented in
`docs/TAURI_PUBKEY_ROTATION.md`.
