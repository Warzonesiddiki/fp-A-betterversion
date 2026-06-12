<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# Testing — FinPlan Pro

> **Vitest + Testing Library + jsdom. 8,331+ tests across ~1,000 files.**
> This guide is what every new contributor reads before opening their
> first PR. The previous "no documentation" gap is now closed.

---

## 0. Ground truth (2026-06-12, post-Prometheus audit)

| Metric             | Value                                                   | Source                                                                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Total test files   | **~1,000**                                              | `find src/ -name '*.test.ts' -o -name '*.test.tsx' \| wc -l`                                      |
| Total tests        | **8,334+**                                              | `npx vitest run --reporter=basic`                                                                 |
| Passing            | **8,331+**                                              | after Apollo's P0 #0 2-commit fix                                                                 |
| Known failing      | **3**                                                   | 1 lucide-react mock gap, 1 PascalCase `WorkerPool` duplicate, 1 AnomalyDetectionEngine percentile |
| Engines with tests | **175 / 176 (99.4 %)**                                  | Prometheus baseline                                                                               |
| Stores with tests  | **36 / 36 (100 %)**                                     | Prometheus baseline                                                                               |
| CI gate order      | **tsc → lint → test → build → bundle size → npm audit** | `.github/workflows/*.yml`                                                                         |

> **If you see more than 3 failures locally**, you have not picked up
> Apollo's P0 #0 fix. Pull `origin/main` and re-run.

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

---

_Mnemosyne 2026-06-12. Update this doc when a new test pattern emerges
or when the CI gate changes. The 8,331+ tests are the safety net; this
guide is the rope that lets new contributors trust it._
