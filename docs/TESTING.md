<!-- DRAFT v0.1 — formalize from drafts/TESTING.md v0.5 + 5-pattern cycle audit — Mnemosyne 2026-06-13 -->

# FinPlan Pro — Testing Guide

> **Audience:** a new engineer writing their first test. Read §1-§3 first
> (5 minutes), then jump to §4 for the pattern that matches what you're
> testing. The 5-pattern cycle audit (§11) is reference for when CI
> fails on pre-existing tests.

## §1 — Test Stack

- **Unit / component:** [Vitest](https://vitest.dev/) +
  [@testing-library/react](https://testing-library.com/) on `jsdom`.
  Configured for **threads pool** with **4 max workers** (per
  `vitest.config.ts`); full-suite heap is **80 GB** via
  `node --max-old-space-size=81920` in the `npm test` script.
- **E2E:** [Playwright](https://playwright.dev/) in `tests/`,
  **chromium only**, 60 s per-test timeout, auto-starts the dev server.
- **Total tests in repo:** 8,334+ across ~1,000 test files (colocated
  with source). Run time: ~3-4 min on the full suite, ~10 s on a
  single file.

## §2 — How to Run

```bash
npm test                                  # full suite, single run, 80 GB heap
npm run test:watch                        # watch mode (HMR for tests)
npx vitest run src/hooks/useAuth.test.ts  # one file
npx vitest run -t "should return 0"       # one test by name
npx vitest run --coverage                 # with v8 coverage
npm run test:e2e                          # Playwright E2E
```

**Tip:** the watch-mode UI (`npm run test:watch` then press `a` for
all, `f` for fail-only, `p` for filename filter) is the fastest
iteration loop.

## §3 — File Naming and Location

**Colocated** with source. The convention is strict: `Foo.tsx →
Foo.test.tsx` (or `Foo.test.ts` for non-component files), in the same
directory.

```
src/engines/CubeEngine.ts          →  src/engines/CubeEngine.test.ts
src/hooks/useAuth.ts               →  src/hooks/useAuth.test.ts
src/components/ui/Button.tsx       →  src/components/ui/Button.test.tsx
src/store/authStore.ts             →  src/store/authStore.test.ts
src/workers/monte-carlo.worker.ts  →  src/workers/monte-carlo.worker.test.ts
```

**Why colocated, not `__tests__/`?** Because (a) you can find the test
by file:line without glob tricks, (b) the test imports the source
directly via `@/...` so refactors break the build (not just the test
output), and (c) deletion of a source file naturally deletes its
test, preventing orphan tests.

**Setup** lives at `src/test/setup.ts` and is auto-loaded via
`vitest.config.ts`'s `setupFiles`. It registers
`@testing-library/jest-dom/vitest` matchers and aliases
`@tauri-apps/plugin-global-shortcut` to `src/test/__mocks__/tauri-shortcut.ts`.

## §4 — Patterns

### 4.1 Store tests

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useFooStore } from '@/store/fooStore';

describe('fooStore', () => {
  beforeEach(() => {
    useFooStore.setState({ ...initialState });   // hard reset
  });

  it('should add an item', () => {
    useFooStore.getState().add('x');
    expect(useFooStore.getState().items).toEqual(['x']);
  });
});
```

Key rules: **always reset state in `beforeEach`** (otherwise tests
leak), never use `act()` (Zustand 4+ is synchronous), and for
`persist`-wrapped stores, **also clear `masterStorage`** via the
`__resetCache()` helper.

### 4.2 Component tests

Use the render helper from `src/test/testUtils.ts` (it wraps in
`BrowserRouter` and `ThemeProvider`):

```ts
import { render, screen } from '@/test/testUtils';
import { MyButton } from './MyButton';

it('renders the label', () => {
  render(<MyButton label="Save" />);
  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
});
```

Query by `getByRole` first; fall back to `getByLabelText` /
`getByText`; **never** use `data-testid` unless there's no accessible
alternative (Hera flags every `data-testid` for justification).

### 4.3 Engine tests

Engines are **pure functions / static methods**, so no DOM, no
harness, no `render`:

```ts
import { describe, it, expect } from 'vitest';
import { CubeEngine } from './CubeEngine';

it('aggregates by sum', () => {
  const cube = CubeEngine.create({ id: 't', dimensions: ['d'], measures: ['m'] });
  CubeEngine.writeCellSync(cube, { d: 'a' }, { m: 5 });
  CubeEngine.writeCellSync(cube, { d: 'b' }, { m: 3 });
  expect(CubeEngine.aggregate(cube, {}, 'm', 'sum')).toBe(8);
});
```

### 4.4 Worker tests

Workers live in `src/workers/<name>.worker.ts` and export a
`runJob(input)` function (the worker wrapper is a thin `postMessage`
shim). Test the **function**, not the Web Worker plumbing:

```ts
import { runMonteCarlo } from './monte-carlo.worker';

it('produces a deterministic distribution for a fixed seed', () => {
  const r1 = runMonteCarlo({ assumptions: [...], iterations: 100, seed: 1, ... });
  const r2 = runMonteCarlo({ assumptions: [...], iterations: 100, seed: 1, ... });
  expect(r1.percentiles).toEqual(r2.percentiles);
});
```

The workers don't need `jsdom`; use `// @vitest-environment node` at
the top of the file.

## §5 — Mocks

Mocks live in `src/test/__mocks__/`. The current set:

```
src/test/__mocks__/
├── tauri-shortcut.ts         # global-shortcut plugin (manual mock)
├── webworker.ts              # Worker / SharedWorker stubs
├── indexeddb.ts              # idb-keyval in-memory shim
└── localforage.ts            # localforage in-memory shim
```

**To add a new mock:**
1. Drop the file in `src/test/__mocks__/` with a named export matching
   the real package's API.
2. Register the alias in `vitest.config.ts` under
   `resolve.alias: { 'package-name': '/path/to/mock.ts' }`.
3. The mock is auto-applied — no `vi.mock()` call needed in tests.

**Heuristic:** mock the **boundary** (Tauri IPC, IndexedDB, browser
APIs), never the **unit under test**. Mocking the engine you're
testing makes the test useless.

## §6 — Coverage Targets

Configured in `vitest.config.ts` (or `.vitest/coverage.json`):

| Layer      | Target  | Rationale                                                    |
| ---------- | ------- | ------------------------------------------------------------ |
| Engines    | ≥ 85 %  | Pure code; cheap to test; financial correctness is critical  |
| Stores     | **100 %** | State is the contract; untested transitions cause user-visible bugs |
| Components | ≥ 70 %  | Pragmatic — focus on user-visible behaviour, not implementation |
| Workers    | ≥ 80 %  | Heavy compute, hard to debug post-ship                       |
| Services   | ≥ 60 %  | Network mocks are expensive; smoke-test the happy path       |
| Hooks      | ≥ 80 %  | Logic is the value; render is tested by the consuming component |

Coverage is reported per-PR in CI; the gate is **"no new uncovered
lines in changed files"** (not a project-wide threshold).

## §7 — E2E Tests (Playwright)

- **Location:** `tests/` (NOT `src/test/`). One spec per top-level
  user flow.
- **Browser:** chromium only (no firefox / webkit — Atlas's CI
  runners are chromium-only per `T-ATL-005`).
- **Per-test timeout:** 60 s (configurable per-test).
- **Fixtures:** `tests/fixtures/` (seed data, login helper,
  factory functions for budgets / scenarios).
- **Auto-starts** the dev server via `playwright.config.ts`'s
  `webServer` block.

```bash
npm run test:e2e                                # headless
npx playwright test --ui                        # UI mode
npx playwright test tests/onboarding.spec.ts   # one spec
npx playwright codegen http://localhost:5173   # record
```

**When to add an E2E test vs a component test:** E2E is for **the
golden path** (a brand-new user can sign up, create a budget, see the
P&L). Component tests are for **the long tail of edge cases**. If
your PR changes the login flow, add an E2E test. If it changes a
chart's tooltip formatting, a component test is enough.

## §8 — CI Gates (the 6-stage pipeline)

The pipeline is defined in `.github/workflows/ci.yml` (4 GHA workflows
per Atlas's `T-ATL-005`). The 6 stages run in order; **any failure
blocks merge**:

| # | Stage               | What it catches                                         | Approx time |
| - | ------------------- | ------------------------------------------------------- | ----------- |
| 1 | `tsc --noEmit`      | Type errors, unused locals, missing imports             | 30 s        |
| 2 | `eslint --fix` (dry)| `react-hooks` deps, `jsx-a11y`, `no-explicit-any`       | 20 s        |
| 3 | `vitest run`        | Pre-existing test drift, mock mismatches, flaky tests   | 3-4 min     |
| 4 | `vite build`        | Bundle size (> 150 KB gzip main → fail), circular imports| 1 min       |
| 5 | `npm audit`         | CVEs in transitive deps                                 | 10 s        |
| 6 | bundle-size check   | Manual-chunk audit, dynamic-import verification         | 20 s        |

**Local pre-flight** (run all 6 in 6 min):

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build && \
  npm audit --omit=dev && \
  node scripts/bundle-check.mjs
```

## §9 — Reference: the 5 failure patterns (2026-06-13 cycle)

When the cycle's pre-push test audit found 65+ pre-existing failures,
they clustered into 5 root-cause patterns. This is the canonical
reference for triaging test drift:

| Pattern | Count | Root cause                                  | Owner          | Status                |
| ------- | ----- | ------------------------------------------- | -------------- | --------------------- |
| A       | 67    | Lucide-react icon API mock missing          | Apollo         | Fixed in P0 #0        |
| B       | 1     | TooltipContent `sideOffset` prop leaked     | Athena         | Fixed in PATTERN-1 patch |
| C       | 5     | Router wrapper missing `MemoryRouter`       | Apollo         | Fixed in PATTERN-2 patch |
| D1      | 1     | CubeEngine percentile: linear interp vs nearest-rank | Hephaestus | **DEFER-2026-001** (co-owned Athena+Hephaestus) |
| D2      | 2     | SaaSMetricsEngine Infinity return + rounding | Hephaestus     | **DEFER-2026-002** (rounding) |
| E       | 3     | Data-integrity edge cases (chunkedStorage race, etc.) | Hephaestus | **DEFER-2026-003** (chunkedStorage race) |

**3-deferral ownership map** (per `docs/security-deferrals.md`):
- **DEFER-2026-001** co-owned: **Athena primary** (test-infra lane) +
  **Hephaestus secondary** (data-integrity lane).
- **DEFER-2026-002** Hephaestus sole (decimalUtils rounding).
- **DEFER-2026-003** Hephaestus sole (chunkedStorage race).

**Co-ownership rule (D-009):** when a defect straddles two Muse lanes,
both own. The primary tag = discovery lane, the secondary tag =
impact lane. The citation chain has both. Do **not** unilaterally
re-assign or drop the secondary tag.

## §10 — Common Pitfalls

| Symptom                                                        | Fix                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Test setup was unable to find a WorkerPool mock`              | Apollo P0 #0; the mock in `src/test/setup.ts:89` is wrong. See §9 Pattern A.            |
| `window.__TAURI__ is undefined` in component test              | Import from `@/test/__mocks__/tauri-shortcut` or stub `globalThis.__TAURI__` in `beforeEach`. |
| `Cannot read property 'getState' of undefined` (Zustand)       | You reset state before the store was created. Use a lazy `getState()` wrapper.        |
| `Found multiple elements with the text "X"`                    | Your `screen.getByText('X')` matches more than one. Use `getAllByText` or be more specific. |
| `act(...)` warning in console                                  | Update the store outside the React tree. Zustand 4+ is sync — no `act()` needed.       |
| `Timeout - Async callback was not invoked within the 5s timeout` | You're waiting on a `setTimeout`. Use `vi.useFakeTimers()` + `vi.advanceTimersByTime`. |
| Coverage report says 0 % for a file                            | The file isn't imported by any test. Either add a test that imports it, or move it to `src/legacy/`. |

## §11 — Quick Reference (one-page cheatsheet)

```bash
# Run one file
npx vitest run src/engines/CubeEngine.test.ts

# Run one test by name
npx vitest run -t "aggregates by sum"

# Coverage
npx vitest run --coverage

# E2E
npm run test:e2e
npx playwright test --ui

# Watch mode (best for TDD)
npm run test:watch

# Debug a single test
npx vitest run --inspect-brk src/hooks/useAuth.test.ts

# Update snapshots (sparingly!)
npx vitest run -u

# Check a specific coverage threshold
npx vitest run --coverage --coverage.thresholds.lines=90
```

**The single most-useful command for new engineers:**
`npx vitest run src/<path>/<file>.test.ts` — runs only your test,
finish in ~5 s, gives you immediate feedback.

**See also:** `docs/ONBOARDING.md` (the 30-min day-1 ramp),
`docs/GLOSSARY.md` (FP&A terms), `docs/ARCHITECTURE.md` (Mermaid
diagrams), `AGENTS.md` §"Testing" (the 7-line command summary),
`docs/STRATEGIC_DECISIONS_LOG.md` (D-006 security-deferral discipline,
D-007 7-phase audit pattern).

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-13 -->
