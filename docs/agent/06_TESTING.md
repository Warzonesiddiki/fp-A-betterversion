# 06 — Testing conventions

## Runner and environment

- Vitest 4, `environment: 'jsdom'`, `pool: 'threads'`, `setupFiles:
['./src/test/setup.ts']`, include `src/**/*.test.{ts,tsx}`; benches are
  excluded from the default run. `testTimeout` / `hookTimeout` = 30 s.
- `VITE_USE_MOCK_AUTH='true'` is injected for tests (vite.config `test.env`)
  so `authStore.login()` uses the local mock session. Production builds
  refuse that flag; do not rely on it outside tests.
- Full suite: `npm run test:sharded` (8 shards, honest exit). Inner loop:
  `npx vitest run <path>`.

## Global mocks in `src/test/setup.ts` (use them; do not re-mock)

| Module                                        | Mock                                                                    | Why                                                                                                                                                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lucide-react`                                | every named export (from `src/test/allLucideIcons.cjs`) → `<svg/>` stub | a per-file partial mock once shadowed this and broke a smoke test when a page adopted a new icon. **Never `vi.mock('lucide-react')` in a test file.** If an icon is genuinely missing, regenerate the list (command in the comment above the mock) |
| `@json-render/core`, `@json-render/react`     | no-op catalog, passthrough renderer                                     | AI dashboard renderer                                                                                                                                                                                                                              |
| `sql.js`                                      | in-memory stub                                                          | storage without WASM                                                                                                                                                                                                                               |
| i18next                                       | initialised with English resources for the keys tests use               | add keys to the resource map when a test needs them                                                                                                                                                                                                |
| `@tauri-apps/plugin-global-shortcut`, `canvg` | aliased stubs in `src/test/__mocks__/`                                  | via vite `resolve.alias`                                                                                                                                                                                                                           |
| `@testing-library/jest-dom/vitest`            | matchers                                                                | `cleanup()` runs `afterEach`                                                                                                                                                                                                                       |

## Time

```ts
import { setClock, resetClock } from '@/utils/clock';
beforeEach(() => setClock('2026-10-15T09:30:00.000Z'));
afterEach(() => resetClock());
```

- Any test whose result depends on "today" **must** pin the clock and build
  fixtures relative to the pinned instant (never hard-code "this month").
- `vi.useFakeTimers()` is compatible (`now()` reads the system `Date`, which
  fake timers control); remember `vi.useRealTimers()` in `afterEach`.
- Code under test must not call `new Date()`/`Date.now()` in calculation
  paths — if your test needs that to pass, fix the code (ratchet).

## Stores

Reset state explicitly in `beforeEach`; stores are module singletons.

```ts
useAuthStore.setState({ user: { …, permissions: ['import:create', 'import:read', 'ui:update'] }, isAuthenticated: true });
useGLStore.setState({ entries: [], importHistory: [], lastImportEntryIds: [], entrySyncState: {}, entryVersions: {} });
```

- Financial actions are RBAC-wrapped (`enforce(Permissions.…)`); an
  unauthenticated store silently refuses. Set the permissions you need.
- The GL store enforces **debits = credits per journal batch**; import
  fixtures must balance or they are rejected (that is a correct failure).
- To stub the server channel: `setGlCommitClient(fake)` from `glStore.ts`.

## Pages

- Three colocated files per page are common: `X.test.tsx` (smoke/a11y
  basics), `X.deep.test.tsx` (behaviour with programmable store stubs — see
  `GLUploadPage.deep.test.tsx` for the pattern), `X.a11y.test.tsx`.
- When you change a store contract, **update the deep-test stubs to the
  full shape** (e.g. `importGLData` returns `batchId/fileHash/rejections/
controlTotals/scope`). A stub that omits fields is a test bug, not a reason
  to add defensive code to the page.
- Query by role/label/testid; assert text that a user would read. Avoid
  snapshot tests.

## Money tests

- `X.money.test.ts` next to any module that computes amounts. Use exact
  expected values that float arithmetic would get wrong (e.g. `0.1 + 0.2`,
  allocations with remainders, large sums). Compare strings or cents, never
  `toBeCloseTo` for money.

## Contract tests that define behaviour (read before touching the area)

| Area                                                                      | File                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------- |
| Import idempotency / atomicity / rejections / provenance / totals / scope | `src/store/glStore.provenance.test.ts`                    |
| Provenance helpers                                                        | `src/services/import/importProvenance.test.ts`            |
| Row parsing / validation fixtures                                         | `src/services/import/parseGLRows.test.ts`                 |
| Upload page behaviour                                                     | `src/pages/data/GLUploadPage.deep.test.tsx`               |
| Trial balance and GL math                                                 | `src/store/glStore.test.ts`, `glStore.money.test.ts`      |
| Money primitive                                                           | `src/utils/money.test.ts`                                 |
| Clock                                                                     | `src/utils/clock.test.ts`                                 |
| SHA-256 (NIST vectors + Node differential)                                | `src/utils/sha256.test.ts`                                |
| Statement oracles                                                         | `src/engines/__tests__/financialStatementOracles.test.ts` |
| Server GL/audit routes                                                    | `server/src/routes/*.test.ts`                             |

## What counts as evidence

- A tally you produced in this tree: `Test Files N passed (N) / Tests M
passed (M)`, with the command.
- For a bug fix: the test that fails on the parent commit and passes on
  yours (say so).
- For a ratchet: the before → after numbers.
- Not evidence: "should pass", a run from another branch, a run before your
  last edit, CI you cannot see.

## Known slow/fragile spots

- `src/utils/masterStorage.stress.test.ts`, `chunkedStorage.race.test.ts`
  are heavier; run them when touching storage.
- Running > ~300 test files in one vitest process needs
  `NODE_OPTIONS=--max-old-space-size=3000`; otherwise use shards.
- Two vitest runs in parallel on 2 vCPUs roughly double each other's time;
  check `ps aux | grep vitest` before starting another.
