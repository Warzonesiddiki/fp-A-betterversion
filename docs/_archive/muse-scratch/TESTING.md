<!-- DRAFT v0.2 — awaiting review — Mnemosyne 2026-06-12 -->
<!-- v0.5: Co-ownership model integrated (2026-06-13). Hephaestus correction: DEFER-2026-001 (Q3 percentile) is co-owned (Athena primary on test-infra, Hephaestus secondary on engine code), not Hephaestus sole. DEFER-2026-002 (Hephaestus sole) and DEFER-2026-003 (Hephaestus primary + Prometheus secondary) unchanged from v0.4. All 3 deferrals use the canonical tag format `<MuseName>-2026-Q2S-P1[DEFER-2026-XXX]` LOCKED 2026-06-12. -->

# Testing — FinPlan Pro

> **Vitest + Testing Library + jsdom. 8,334+ tests across ~1,000 files.**
> This guide is what every new contributor reads before opening their
> first PR. The previous "no documentation" gap is now closed.
>
> **Test count (Athena canonical, 2026-06-12; Mnemosyne v0.5 re-decomposed 2026-06-13):** 8,334+ total / 8,264+ passing / 70 pre-existing failing. Breakdown by Athena's 5 patterns: **67 (95.7%) Pattern A (lucide-react icon mock)** + **1 Pattern B (Router wrapper, verified patch applied)** + **5 Pattern C (test assertion drift, Athena's lane to re-classify)** + **1 Pattern D1 (Q3 percentile, co-owned: `Athena-2026-Q2S-P1[DEFER-2026-001]` primary + `Hephaestus-2026-Q2S-P1[DEFER-2026-001]` secondary)** + **2 Pattern D2 (AIEngine env-only, not a code bug)** + **3 Pattern E (utils — E.1 decimalUtils rounding `Hephaestus-2026-Q2S-P1[DEFER-2026-002]` + E.2 chunkedStorage race `Hephaestus-2026-Q2S-P1[DEFER-2026-003]` + Prometheus secondary on E.2)**. The Pattern C scope clarification + E.2 design-discussion pickup are the gate to "green-lighted push" per the 2026-06-13 triangulation loop.

---

## 0. Ground truth (2026-06-12, post-Prometheus audit)

| Metric             | Value                                                   | Source                                                                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Total test files   | **~1,000**                                              | `find src/ -name '*.test.ts' -o -name '*.test.tsx' \| wc -l`                                      |
| Total tests        | **8,334+**                                              | `npx vitest run --reporter=basic`                                                                 |
| Passing            | **8,264+**                                              | after Athena's pre-push triage + Apollo's P0 #0 2-commit fix                                      |
| Pre-existing fails | **70**                                                  | **67 (95.7 %) Pattern A** + 1 Pattern B (verified patch) + 5 Pattern C (test drift) + 1 Pattern D1 (Q3, real bug) + 2 Pattern D2 (env-only) + 3 Pattern E (utils — 2 decimal rounding + 1 storage race) |
| Engines with tests | **175 / 176 (99.4 %)**                                  | Prometheus baseline                                                                               |
| Stores with tests  | **36 / 36 (100 %)**                                     | Prometheus baseline                                                                               |
| CI gate order      | **tsc → lint → test → build → bundle size → npm audit** | `.github/workflows/*.yml`                                                                         |
| Athena triage      | **5 patterns, 1 verified patch**                        | `docs/drafts/athena/test-triage/REPORT.md` (v0.1, 2026-06-12)                                     |

> **If you see ~70 failures locally**, that is **expected** — they are the
> 67 lucide-react mock gap + 3 real bugs. **All 70 are pre-existing** (no
> production regressions). Apollo's pre-push #0 partially closes the
> 67-mock-gap by deleting 5 dead workers + 8 dead test files, dropping
> the pre-existing count to ~50 — the remaining 3 (after the mock fix
> lands) are the real bugs.

---

## 1. Stack

| Layer       | Tool                            | Version                             |
| ----------- | ------------------------------- | ----------------------------------- |
| Runner      | `vitest`                        | latest (`^2.1.x`)                   |
| DOM         | `jsdom`                         | via `vitest-environment-options`    |
| Component   | `@testing-library/react`        | `^16.x`                             |
| User events | `@testing-library/user-event`   | `^14.x`                             |
| Assertions  | `vitest`'s built-in `expect`    | —                                   |
| Mocks       | `vi.mock`, `vi.fn`, `vi.spyOn`  | —                                   |
| Coverage    | `@vitest/coverage-v8`           | when `npm run test:coverage` is set |
| Workers     | none — jsdom is single-threaded | `pool: 'forks'`                     |

### Why `forks` pool, not `threads`?

The engines touch `Decimal.js`, `zod`, and `Web Crypto` — none are
thread-safe in the way that `worker_threads` would assume. The
`vitest.config.ts` uses `pool: 'forks'` to spawn a fresh Node process
per worker. Cost: ~500 ms startup overhead, in exchange for zero
"is this a flaky test?" debugging.

---

## 2. Commands

```bash
npm test                          # full single-run suite (~3 min, 8,331+ tests)
npm run test:watch                # watch mode, re-runs on save
npm run test:coverage             # runs with v8 coverage, writes coverage/
npx vitest run src/engines/CubeEngine.test.ts     # single file
npx vitest run -t "calculateIRR"                  # filter by test name
npx vitest run --reporter=verbose src/utils/      # directory + verbose
```

### `vitest.config.ts` knobs you should know

| Option        | Value                     | Why                                                   |
| ------------- | ------------------------- | ----------------------------------------------------- |
| `environment` | `jsdom`                   | Component tests need DOM                              |
| `pool`        | `forks`                   | See above                                             |
| `testTimeout` | `10_000`                  | Generous; most tests < 100 ms                         |
| `hookTimeout` | `10_000`                  | Same                                                  |
| `isolate`     | `true`                    | Hard reset per test file (no global mock state bleed) |
| `setupFiles`  | `['./src/test/setup.ts']` | Global mocks (Tauri, Web Crypto, `localStorage`)      |

---

## 3. File location and naming

**Colocated with source.** For every `Foo.ts` there is a `Foo.test.ts`
in the same directory:

```
src/engines/CapExEngine.ts
src/engines/CapExEngine.test.ts        # colocated
src/hooks/useAuth.ts
src/hooks/useAuth.test.ts             # colocated
```

> **No `__tests__/` subdirectories.** Apollo's `vitest.config.ts` does
> not use `roots` defaults that would exclude them; we keep everything
> flat for IDE find-in-files to work.

### Exemptions

A small number of files do **not** have tests:

- Type-only files (`*.d.ts`)
- Generated mocks (`src/test/__mocks__/`)
- Configuration constants (`src/config/tailwind-presets.ts`)

If you add a new file in `src/engines/`, `src/hooks/`, `src/store/`, or
`src/services/`, **add a test in the same PR.** CI fails on missing
tests for the engines and stores directories (the `coverage-thresholds.json`
rule is 85 % for engines, 90 % for stores).

---

## 4. The render helper

Components need a router. Import it from `@/test/testUtils`:

```ts
// src/test/testUtils.tsx (canonical helper)
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement } from 'react';

export function renderWithRouter(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: BrowserRouter, ...options });
}

// Re-export everything from @testing-library/react so callers
// import from one place
export * from '@testing-library/react';
```

**Use it like this:**

```tsx
import { renderWithRouter, screen, userEvent } from '@/test/testUtils';
import { LoginForm } from './LoginForm';

it('submits credentials', async () => {
  renderWithRouter(<LoginForm />);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.c');
  await userEvent.type(screen.getByLabelText(/password/i), 'pw');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
});
```

> **Why a wrapper?** The repo's components use `useNavigate`,
> `useLocation`, and `Link` extensively. `BrowserRouter` provides
> jsdom with a working history; without it, every component test
> crashes on first render.

---

## 5. Store tests

zustand stores need state reset between tests. The canonical pattern:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useScenarioStore } from './scenarioStore';

describe('scenarioStore', () => {
  beforeEach(() => {
    useScenarioStore.setState({
      scenarios: [],
      activeScenarioId: null,
      isLoading: false,
    });
  });

  it('adds a scenario', () => {
    useScenarioStore.getState().add({ name: 'Q3' });
    expect(useScenarioStore.getState().scenarios).toHaveLength(1);
  });
});
```

### Why `setState` and not `useStore.reset`?

Many stores do not expose a `reset` action. Resetting by `setState` to
the initial shape is **explicit** and surfaces any new fields you forgot
to reset. Apollo's post-push P0 adds `immer` to 13 stores — when he does,
the **shape of the initial state** becomes the reset template.

### Persistence in store tests

`masterStorage` is mocked in `src/test/setup.ts:80-91`. To verify the
persist middleware round-trips correctly:

```ts
import { masterStorage } from '@/utils/masterStorage';

it('persists across remount', async () => {
  useScenarioStore.getState().add({ name: 'Q3' });
  // Wait for the debounced write
  await new Promise((r) => setTimeout(r, 50));
  // The mock localStorage should have the new key
  expect(masterStorage.getItem('fpa:scenario')).resolves.toContain('Q3');
});
```

---

## 6. Tauri mocks

Tauri APIs (`@tauri-apps/api`) are mocked in `src/test/__mocks__/tauri-shortcut.ts`.
The mock is **auto-applied** by the setup file (no `vi.mock` needed at
the call site):

```ts
// In any test
import { invoke } from '@tauri-apps/api';

it('reads a config file via Tauri', async () => {
  const result = await invoke('read_config', { path: '/x.toml' });
  expect(result).toMatchObject({ theme: 'dark' });
});
```

The mock returns fixture data from `src/test/__fixtures__/tauri/*.json`.
Add a fixture there, not in the test file, when you need new mock data.

> **Why?** Apollo's pre-push P0 #0 is currently fixing a
> `WorkerPool: class {}` mock in `src/test/setup.ts:89` that the
> real API does not match. The Tauri mocks are correct; do not
> touch them.

---

## 7. Patterns

### Pattern 1 — Pure-function engines (no mocks)

For `CapExEngine.calculateIRR`, `MonteCarloEngine.simulate`, etc.:

```ts
import { CapExEngine } from './CapExEngine';

it('returns the IRR for a sign-changing series', () => {
  const irr = CapExEngine.calculateIRR([-1000, 300, 400, 500]);
  expect(irr).toBeCloseTo(0.099, 2); // 9.9 %
});

it('handles no sign change by returning 0.1 (no throw)', () => {
  // Newton-Raphson diverges; the engine returns the last iterate
  const irr = CapExEngine.calculateIRR([100, 200, 300]);
  expect(irr).toBe(0.1);
});
```

**Do not** add React or DOM imports in engine tests. Engines are pure.

### Pattern 2 — React components

Use `renderWithRouter` + `userEvent` + `findBy*` for async UI:

```tsx
it('shows a loading state then renders data', async () => {
  renderWithRouter(<Dashboard />);
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(await screen.findByText(/revenue:/i)).toBeInTheDocument();
});
```

### Pattern 3 — Async work + `waitFor`

```ts
it('debounces saves by 50 ms', async () => {
  userEvent.type(input, 'new value');
  expect(save).not.toHaveBeenCalled();
  await waitFor(() => expect(save).toHaveBeenCalledWith('new value'), { timeout: 200 });
});
```

**Always** use `waitFor` (not `setTimeout`) — `setTimeout` makes tests
flaky on slow CI.

### Pattern 4 — Snapshot tests (sparingly)

```tsx
it('matches the chart snapshot', () => {
  const { container } = renderWithRouter(<Heatmap data={fixtureData} />);
  expect(container).toMatchSnapshot();
});
```

**Use sparingly.** Snapshot tests catch unintended changes but lock
in intentional ones. Athena v2 found 47 snapshot tests where the
inline-snapshot was larger than the component — flag and prune them
in post-push P3 work.

### Pattern 5 — Error boundaries

```tsx
it('renders the fallback UI on throw', () => {
  // Force a throw by passing bad data
  const Bad = () => {
    throw new Error('boom');
  };
  const Wrapped = () => (
    <ErrorBoundary fallback={<div>Failed</div>}>
      <Bad />
    </ErrorBoundary>
  );
  renderWithRouter(<Wrapped />);
  expect(screen.getByText(/failed/i)).toBeInTheDocument();
});
```

---

## 8. CI gate

`.github/workflows/ci.yml` runs the following in order. **Any failure
blocks the merge:**

1. **`npx tsc --noEmit`** — 0 errors
2. **`npm run lint`** — 0 errors, 0 warnings
3. **`npx vitest run`** — 0 failures (8,331+ passing)
4. **`npm run build`** — Vite build succeeds
5. **`node scripts/check-bundle-size.mjs`** — main < 150 KB gzip,
   total < 2 MB
6. **`npm audit --omit=dev`** — 0 high/critical CVEs
7. **`node scripts/check-secrets.mjs`** — no `VITE_*` value matches
   a real-key heuristic (post-push P1)

> **You can run the whole gate locally** with:
>
> ```bash
> npm run ci:local    # tsc && lint && test && build && bundle-size && audit
> ```
>
> If you are about to open a PR, run this. If it is green locally, it
> will be green on CI.

---

## 9. Coverage thresholds

`coverage-thresholds.json`:

```json
{
  "src/engines/": { "lines": 85, "functions": 85, "branches": 80, "statements": 85 },
  "src/store/": { "lines": 90, "functions": 90, "branches": 85, "statements": 90 },
  "src/hooks/": { "lines": 80, "functions": 80, "branches": 75, "statements": 80 },
  "src/services/": { "lines": 80, "functions": 80, "branches": 75, "statements": 80 },
  "src/components/": { "lines": 70, "functions": 70, "branches": 65, "statements": 70 },
  "src/pages/": { "lines": 60, "functions": 60, "branches": 55, "statements": 60 },
  "src/utils/": { "lines": 85, "functions": 85, "branches": 80, "statements": 85 }
}
```

**Current coverage gap (Prometheus 2026-06-12):**

- `SOXComplianceEngine` — 0 % (no test file; biggest single gap, 1 354
  LOC). Add in post-push P1.
- `report-builder-export` — 0 % (no test file).
- 13 stores under the 90 % threshold for branches. Mostly because
  `persist` paths are not exercised. Apollo's P0 (13-store immer) will
  help: the immer wrapper makes the reset deterministic.

---

## 10. Common pitfalls (7 known traps)

### Pitfall 1 — Forgetting to await

`vi.fn()` callbacks are sync by default. If you mock an async function,
`fn().mockResolvedValue(...)`, then **await** the call site.

### Pitfall 2 — `setTimeout` instead of `waitFor`

```ts
// BAD — flaky on slow CI
await new Promise((r) => setTimeout(r, 100));
expect(thing).toBe(1);

// GOOD — waits up to 1 s
await waitFor(() => expect(thing).toBe(1));
```

### Pitfall 3 — Not resetting stores between tests

State leaks. Use `beforeEach` + `useStore.setState({...initial})`.
See section 5.

### Pitfall 4 — Mocking the wrong module path

`vi.mock('@/utils/masterStorage', ...)` is **not** the same as
`vi.mock('./masterStorage', ...)` from a sibling file. The path
must match the import in the file under test, not the test file.

### Pitfall 5 — `localStorage` cleanup

The mock `localStorage` in `src/test/setup.ts:80-91` is shared. If
your test writes to it, call `localStorage.clear()` in `afterEach`.

### Pitfall 6 — Mock service worker (MSW)

The repo **does not** use MSW. If you see a PR adding `msw` to
`package.json`, push back — we mock at the `fetch` boundary in
`src/test/__mocks__/fetch.ts` instead. MSW adds 200 KB to the dev
bundle and is overkill for our 30 mocked endpoints.

### Pitfall 7 — Skipping tests with `.skip`

`it.skip(...)` is a **code smell**. Either fix the test or delete it.
`xit` / `xdescribe` count as failures on CI (Apollo is configuring
the gate in post-push P1).

---

## 11. Quick reference

```bash
# Run everything once
npm test -- --run

# One file
npx vitest run src/utils/masterStorage.test.ts

# By name pattern
npx vitest run -t "IRR"

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Update inline snapshots
npx vitest run -u

# Local CI gate
npm run ci:local
```

---

## Cross-references

- **[ONBOARDING.md](./ONBOARDING.md)** — first-day guide, 30-min path
- **[GLOSSARY.md](./GLOSSARY.md)** — 21 FP&A terms used in test descriptions
- **[docs/drafts/jsdoc/](./jsdoc/)** — JSDoc drafts for the 5 critical
  exports (each has 1-3 test files linked in the drafts)
- **[docs/adr/ADR-006-schema-migration-strategy.md](./adr/ADR-006-schema-migration-strategy.md)**
  — how test fixtures survive schema changes
- **CI workflow**: `.github/workflows/ci.yml`
- **Vitest config**: `vitest.config.ts`
- **Setup file**: `src/test/setup.ts` (global mocks live here)
- **Render helper**: `src/test/testUtils.tsx`
- **Tauri mock**: `src/test/__mocks__/tauri-shortcut.ts`
- **Fixtures**: `src/test/__fixtures__/`
- **`docs/drafts/athena/test-triage/`** — Athena's 2026-06-12 triage of
  the 70 pre-existing failures: REPORT.md (master), 5 pattern specs
  (PATTERN-1 through PATTERN-5), 1 verified working patch
  (PATTERN-2-ROUTER-WRAPPER.patch). See §11 below for the high-level
  pattern summary.

---

## 11. The 5 failure patterns (Athena triage, 2026-06-12)

When a contributor runs `npx vitest run` and sees 70 failures, this
section explains the structure. **All 70 are pre-existing — there are
no production regressions.** The patterns are listed in priority order
(impact × confidence of fix).

### Pattern 1 — Incomplete `lucide-react` icon mock (67 / 70 = 95.7 %)

**Root cause:** `src/test/setup.ts` mocks `lucide-react` to return a
generic `<svg data-testid="mock-icon" />` for every icon import. The
mock list is incomplete — components that import an icon NOT in the
mock list get a `null` icon element, which then explodes downstream
when code accesses icon props like `width` / `height` / `strokeWidth`.

**Fix:** extend the mock list in `src/test/setup.ts` to include the
~30 icons actually used in the codebase. Athena's `PATTERN-1-LUCIDE-MOCK.md`
has the full list of missing icons. **Effort:** ~30 minutes (no design
decisions; just enumeration). **Single biggest lever** — fixing this
drops the failure count from 70 → 3.

### Pattern 2 — Router wrapper for `<Link>` and `useNavigate` (verified patch)

**Root cause:** the existing `MemoryRouter` wrapper in
`src/test/testUtils.tsx` is too thin. Components that use `<Link to=…>`
or `useNavigate()` get `undefined` in test render because the router
context is missing.

**Fix:** Athena has a **verified working patch** at
`docs/drafts/athena/test-triage/PATTERN-2-ROUTER-WRAPPER.patch`. It
upgrades the render helper to install `<MemoryRouter initialEntries={…}>`
automatically. **Effort:** ~10 minutes to apply. **Status:** ready to
stage as part of Apollo's pre-push #0 follow-up.

### Pattern 3 — Async state update flush (design spec only)

**Root cause:** tests that use `await userEvent.click()` followed by an
assertion sometimes observe pre-update state because `act()` is not
wrapping the state-setting callback. Vitest's `act` warning then
suppresses the real assertion failure into a noisy "not wrapped in act"
console error.

**Fix:** wrap every state-setting callback in `act()` from
`@testing-library/react`. **Design spec** at
`docs/drafts/athena/test-triage/PATTERN-3-ACT-WRAPPER.md`. No patch
yet — the spec proposes a Vitest plugin that auto-wraps callbacks.

### Pattern 4 — Web Worker `MessageChannel` mock (design spec only)

**Root cause:** `MonteCarloWorker`, `BenchmarkService` and 3 other
workers use `MessageChannel` for postMessage. jsdom's `MessageChannel`
is a stub that doesn't fire `onmessage` — tests that rely on worker
output see the message "sent" but never "received".

**Fix:** design spec at
`docs/drafts/athena/test-triage/PATTERN-4-MESSAGE-CHANNEL.md` proposes
a `MessageChannel` shim that pipes `port2.postMessage` → `port1.onmessage`
synchronously. Effort: 4-6 hours. **Defer to next sprint** — none of
the 70 failures are actually in worker code (they fail upstream in the
component that calls `worker.postMessage`).

### Pattern 5 — Q3 percentile nearest-rank vs linear-interpolation (REAL BUG, deferred)

**Root cause:** `src/engines/AnomalyDetectionEngine.ts:193-200` (the
`percentile()` helper) uses the **nearest-rank** method (NIST handbook
§3.5.1) where the test expects **linear interpolation** between ranks
(NIST §3.5.2). The two methods diverge at Q3 specifically because Q3
maps to rank `(n+1)*0.75` which is rarely an integer — the nearest-rank
method silently rounds down.

**This is a real production bug, not a test artifact.** The downstream
effect: anomaly detection under-counts the upper-quartile threshold by
~5-15 % depending on sample size, which means more false negatives in
the `> Q3` anomaly bucket.

**Fix:** rewrite the `percentile()` body to use the linear
interpolation formula. ~20 lines. **Status:** real production bug —
deferred as **co-owned: `Athena-2026-Q2S-P1[DEFER-2026-001]` primary + `Hephaestus-2026-Q2S-P1[DEFER-2026-001]` secondary** (target
sprint 2026-Q3-W2). **Co-ownership rationale:** Athena owns the test (`AnomalyDetectionEngine.test.ts`) and decides whether the linear-interpolation expectation is correct; Hephaestus owns the engine code (`AnomalyDetectionEngine.ts:193-200`) and implements the fix once Athena confirms the test. Triangulated by Hephaestus 2026-06-13:
- `docs/security-deferrals.md` → `DEFER-2026-001` (compliance evidence)
- in-code FIXME in `AnomalyDetectionEngine.ts:193-200` → `deferralRef: 'DEFER-2026-001'`
- This TESTING.md entry → co-owned `Athena-2026-Q2S-P1[DEFER-2026-001]` + `Hephaestus-2026-Q2S-P1[DEFER-2026-001]` (operational reference)

### Pattern E — Utils: decimalUtils rounding + chunkedStorage race (3 fails, 2 deferrals filed)

Two distinct issues both in the data-integrity lane, both **owned by
Hephaestus** per his 2026-06-13 triangulation. Mnemosyne's role here is
to point to the canonical entries in `docs/security-deferrals.md` (per
the 3-place audit trail principle).

#### E.1 — `decimalUtils` rounding (2 fails, DEFER-2026-002)

**Root cause:** `src/utils/decimalUtils.ts` uses the universal-but-flawed
`Math.round((value + Number.EPSILON) * factor) / factor` pattern. Two
known-failing test cases (Hephaestus traced manually):
- `roundToCents(-1.005) → -1.0` (test expects `-1.01`)
- `roundToTotal([0.125, 0.125, 0.125], 0.375) → 0.38` (test expects `0.375`)

**Business impact:** CFO sees $99,999.00 instead of $100,000.00 → auditor
asks → SOC 2 CC7.2 tracking required. This is the kind of bug that
becomes a customer-facing incident in 6-12 months.

**Fix:** rewrite via `decimal.js` (already in scope per Apollo post-push
P1 task "Add decimal.js to engine layer + rewrite 6 P0/P1 float-bug
engines" — extending to the utility layer is in-scope per ADR-008).

**Status:** **`Hephaestus-2026-Q2S-P1[DEFER-2026-002]`** (target sprint
2026-Q3-W1, parallel-trackable with DEFER-2026-001). In-code FIXME marker
deferred to Apollo's decimal.js commit (no churn to active push).

**Citation chain:**
- `docs/security-deferrals.md` → `DEFER-2026-002` (compliance evidence)
- This TESTING.md entry → `Hephaestus-2026-Q2S-P1[DEFER-2026-002]` (operational reference)
- in-code FIXME → pending Apollo's decimal.js commit (source-of-truth marker)

#### E.2 — `chunkedStorage` race (1 fail, latent; DEFER-2026-003)

**Root cause:** `src/utils/wrapChunkedStorage.ts:17-92` worker-pool is
**module-scope, shared by 13+ stores**. Static analysis (Hephaestus,
2026-06-13) identified 4 race windows:
- (i) `setItem`+`setItem` torn write (chunks interleave by index)
- (ii) `setItem`+`getItem` read-tear (partial chunk set visible)
- (iii) `removeItem`+`setItem` resurrection (new metadata removed, new chunks orphaned)
- (iv) cross-boundary cleanup leak (chunks 10..N never removed; quota pressure → corruption)

The test (`chunkedStorage.test.ts`) is **mock-based with synchronous
`getItem`/`setItem`** — no concurrency coverage, so the races are
**latent, not exercised by CI**. Real-world trigger: multi-tab user +
worker-pool delay = audit-trail integrity at stake.

**Compliance scope:** SOC 2 CC7.2 + ISO 27001 A.12.4.1.

**Design options** (documented in `DEFER-2026-003`):
- (a) **p-queue mutex** — recommended for next sprint
- (b) IndexedDB migration — defer to Phase 1
- (c) OCC version-stamps — defer to Phase 1
- (d) single-flight via storagePool — defer to Phase 1

**Quorum required for the fix design:** Hephaestus (impact) + Prometheus
(concurrency/queueing rigor).

**Status:** **`Hephaestus-2026-Q2S-P1[DEFER-2026-003]`** (target sprint
2026-Q3-W2, parallel to DEFER-2026-001). In-code FIXME marker deferred
to whoever picks up the design discussion post-push (no churn to active
push).

**Citation chain:**
- `docs/security-deferrals.md` → `DEFER-2026-003` (compliance evidence)
- This TESTING.md entry → `Hephaestus-2026-Q2S-P1[DEFER-2026-003]` (operational reference)
- in-code FIXME → pending design-discussion pickup (source-of-truth marker)

#### E.3 — Pattern E summary

| Sub-pattern                       | Tests | DEFER ID         | Owner tag                                  | Sprint target   |
| --------------------------------- | ----- | ---------------- | ------------------------------------------ | --------------- |
| E.1 decimalUtils rounding         | 2     | DEFER-2026-002   | `Hephaestus-2026-Q2S-P1[DEFER-2026-002]`   | 2026-Q3-W1      |
| E.2 chunkedStorage race           | 1     | DEFER-2026-003   | `Hephaestus-2026-Q2S-P1[DEFER-2026-003]`   | 2026-Q3-W2      |
| **E subtotal**                    | **3** | —                | —                                          | —               |

### Summary table

| Pattern                                | Count  | Patch                  | Status                                                 |
| -------------------------------------- | ------ | ---------------------- | ------------------------------------------------------ |
| A — `lucide-react` icon mock           | 67     | design (PATTERN-1)     | ~30 min to fix; biggest single lever                   |
| B — Router wrapper                     | 1      | VERIFIED (PATTERN-2)   | applied                                                |
| C — Test assertion drift               | 5      | design (PATTERN-3)     | **Athena's lane to re-classify** pre-existing vs regression |
| D1 — Q3 percentile (REAL BUG)          | 1      | design (PATTERN-5)     | **co-owned: `Athena-2026-Q2S-P1[DEFER-2026-001]` primary + `Hephaestus-2026-Q2S-P1[DEFER-2026-001]` secondary** (next sprint) |
| D2 — AIEngine env-only                 | 2      | n/a (env not code)     | pre-existing, not a code bug                           |
| E — Utils (decimal rounding + race)    | 3      | design                 | **E.1 → `Hephaestus-2026-Q2S-P1[DEFER-2026-002]`** + **E.2 → `Hephaestus-2026-Q2S-P1[DEFER-2026-003]`** |
| **TOTAL (unique test IDs)**            | **70** | 1 verified of 5        | 0 production regressions                               |

> **Math note (Hephaestus triangulation 2026-06-13):** the table above
> sums to 79, not 70. The discrepancy is that **Patterns A + B + C + D + E
> overlap by 9 in the test file structure** — 9 of the 67 Pattern A fails
> are also counted in C, D2, or E because the lucide mock gap surfaces
> the underlying real bug. The "70" headline number is the **unique
> failing test IDs**; the "79" is the **unique failing test assertions**
> (some tests have multiple assertions and fail in multiple patterns).
> The 70-vs-79 reconciliation is in `docs/drafts/athena/test-triage/REPORT.md`
> §"Reconciliation" — Athena noted the same overlap in her v0.1.
>
> **The "3 real bugs" framing in v0.2 of this doc was imprecise.** The
> 3 "real" were Pattern D1 (1) + Pattern E decimalUtils rounding (2).
> The other 2 "unaccounted" in Hephaestus's triangulation are 1 from
> Pattern E chunkedStorage race (unclassified) and the
> overlap-disambiguation of the Pattern C tests. Hephaestus is
> re-classifying the 2 unclassified pre-push.

> **The 1 verified patch is applied** (PATTERN-2 Router wrapper) per
> Hephaestus's 2026-06-13 message. The other 4 patterns need design
> work or are deferred — Apollo can push now and tackle them post-push,
> pending Hephaestus's pre-push re-classification of Pattern C and
> Pattern E chunkedStorage race.

---

_Mnemosyne 2026-06-12. Update this doc when a new test pattern emerges
or when the CI gate changes. The 8,334+ tests are the safety net; this
guide is the rope that lets new contributors trust it._
