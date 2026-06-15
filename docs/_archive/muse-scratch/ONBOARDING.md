<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# Onboarding — FinPlan Pro

> **Get from `git clone` to a green `npm test` in 30 minutes.**
> Industry baseline for similar React/TS codebases is 1-2 days; this guide
> gets new contributors there on day one.

---

## 0. Prerequisites (5 min)

| Tool       | Version       | Verify            | Why                                  |
| ---------- | ------------- | ----------------- | ------------------------------------ |
| **Node**   | 22.x LTS      | `node -v`         | Vite 7 + Tauri 2 require Node ≥ 20.6 |
| **npm**    | 10.x or 11.x  | `npm -v`          | Lockfile is `package-lock.json`      |
| **Git**    | 2.40+         | `git --version`   | Optional: LFS for any binary assets  |
| **Rust**   | 1.78+ (Tauri) | `rustc --version` | Only for `npm run tauri:*` scripts   |
| **VSCode** | Latest        | —                 | Recommended; extensions below        |

### Recommended VSCode extensions

| Extension                   | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `dbaeumer.vscode-eslint`    | Real-time linting (matches CI `npm run lint`)           |
| `esbenp.prettier-vscode`    | Formatting (matches Prettier 3 config)                  |
| `bradlc.vscode-tailwindcss` | IntelliSense for Tailwind 4 + design tokens             |
| `ms-playwright.playwright`  | E2E debug; Cypress not used in this repo                |
| `tauri-apps.tauri-vscode`   | Tauri schema + commands (only if shipping Tauri builds) |

---

## 1. First 30 minutes

### Minute 0-5: Clone + install

```bash
git clone https://github.com/<org>/finplan-pro.git
cd finplan-pro
npm ci              # exact versions from package-lock.json (NOT npm install)
```

> **Why `npm ci`?** `npm install` would mutate `package-lock.json` against
> the 1,111 deps. CI uses `npm ci`; you should too. If the install fails
> on `node-gyp` rebuilds, you don't have Rust — that's OK, the web build
> doesn't need it.

### Minute 5-10: Verify the local build

```bash
npm test -- --run   # full Vitest run, 8,331+ tests, ~3 minutes
npm run build       # Vite build, main <150 KB gzip
npm run lint        # ESLint flat config
```

> **Expected ground truth (2026-06-12):**
>
> - **Tests**: 8,331+ passing, 3 known failures (`WorkerPool` PascalCase
>   duplicate, `lucide-react` mock gap, 1 percentile-engine edge case).
>   Apollo's pre-push P0 #0 is the 2-commit fix; ignore the 3 red lines
>   for now.
> - **Bundle**: main = 55.95 KB gzip, total ≈ 1.32 MB across 100+ chunks
>   (well under 2 MB budget).
> - **Lint**: 0 errors, 0 warnings (the canonical config in `eslint.config.js`).
> - **`npm audit`**: 0 CVEs across 1,111 deps (Prometheus baseline).

### Minute 10-15: Run dev server

```bash
npm run dev
# → http://localhost:5173
```

Login with **mock auth** (Vite dev server default):

- Email: `demo@finplan.dev`
- Password: anything (mock auth accepts all passwords)

> **Mock auth is gated.** In `.env.local`, `VITE_USE_MOCK_AUTH=true`. The
> production build (with `VITE_USE_MOCK_AUTH=false`) refuses to start in
> mock mode. See `ADR-005` for the storage path and Hephaestus's P0
> finding that the gate was added in 2026-06-12.

### Minute 15-20: Read the orientation docs

Read in this order — each builds on the previous:

1. **[`README.md`](./README.md)** — 2-minute elevator pitch + tech stack
2. **[`GLOSSARY.md`](./GLOSSARY.md)** — 21 FP&A terms you'll see in
   every engine (`NPV`, `EBITDA`, `OLAP cube`, `IC`, `FX revaluation`, etc.)
3. **[`docs/adr/`](./adr/)** — 6 ADRs covering the major decisions
4. **[`docs/ARCHITECTURE.md`](./diagrams/ARCHITECTURE.md)** — combined
   Mermaid view of data flow, stores, engines, auth, and the build pipeline
5. **[`docs/TESTING.md`](./TESTING.md)** — how to run, write, and debug
   the 825 test files

### Minute 20-25: Walk one of the 5 critical exports

Pick one, read the source, read the JSDoc draft, run its test:

| Export                                       | JSDoc draft                                | Test file                              |
| -------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| `CubeEngine` (class)                         | `docs/drafts/jsdoc/CubeEngine.ts.md`       | `src/engines/CubeEngine.test.ts`       |
| `CapExEngine.calculateIRR`                   | `docs/drafts/jsdoc/CapExEngine.ts.md`      | `src/engines/CapExEngine.test.ts`      |
| `MonteCarloEngine.simulate`                  | `docs/drafts/jsdoc/MonteCarloEngine.ts.md` | `src/engines/MonteCarloEngine.test.ts` |
| `masterStorage` (Zustand `storage:` adapter) | `docs/drafts/jsdoc/masterStorage.ts.md`    | `src/utils/masterStorage.test.ts`      |
| `useAuth` (hook)                             | `docs/drafts/jsdoc/useAuth.ts.md`          | `src/hooks/useAuth.test.ts`            |

> **Tip:** the JSDoc drafts are in `docs/drafts/jsdoc/` and are _not yet_
> merged into source. They show the JSDoc Apollo will paste in. Reading
> them gives you 30 minutes of context on what each export does and why.

### Minute 25-30: Open the issue board

1. Go to GitHub → Issues → filter `label:good-first-issue`
2. Pick one that is **P3** severity and ≤ 100 LOC
3. Comment "I'd like to take this" and wait for assignment

---

## 2. First commit path (Day 1-2)

### Recommended first PR — a `P3` from the post-push queue

The 38-task post-push queue is in `docs/perfection-plan/`. Start with
one of these (all small, all isolated, all have a clear "before / after"):

| Task                                                       | Files touched | Approx LOC |
| ---------------------------------------------------------- | ------------- | ---------- |
| `EngineRegistry.preloadCritical()` → `requestIdleCallback` | 1             | ~30        |
| `DataGrid.tsx` dark variant (Hera P1)                      | 1             | ~15        |
| Standardize dark-gray token (slate vs gray vs zinc)        | ~10           | ~30        |
| `CurrencyInput.tsx` dark variant                           | 1             | ~12        |
| `EmptyState.tsx` dark variant                              | 1             | ~8         |

### PR checklist

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0/0
- [ ] `npx vitest run src/<your-files>` all green
- [ ] `npm run build` succeeds; bundle did not grow > 1 KB
- [ ] PR title matches conventional-changelog format (`fix:`, `feat:`,
      `chore:`, `docs:`, etc.) — see `CONTRIBUTING.md`
- [ ] PR description links the issue (`Closes #NNN`)

### Where to ask for help

| Channel                    | When                                    |
| -------------------------- | --------------------------------------- |
| GitHub Discussions → "Q&A" | General questions, "how does X work"    |
| GitHub Issues → "Bug"      | Suspected defects, with repro           |
| GitHub Issues → "RFC"      | Substantive changes (>100 LOC, new dep) |
| Slack `#finplan-dev`       | Real-time chat, pings for review        |

---

## 3. Common pitfalls (7 known traps)

> Mnemosyne's audit and Hephaestus's security audit identified these.
> Knowing them up-front saves a day of debugging.

### Pitfall 1 — `localStorage` in a store

**Symptom:** "Why doesn't my new persisted slice show up in the test?"
**Cause:** You wrote `localStorage.setItem('foo', ...)` directly. The
`uiStore` did this; Athena v2 caught it; Apollo is migrating all 35 stores
to `masterStorage` (see `ADR-005`).
**Fix:** `import { masterStorage } from '@/utils/masterStorage'`, then
`persist(immer((set, get) => ({...})), { storage: masterStorage })`.

### Pitfall 2 — Adding to a store without `subscribeWithSelector(persist(immer(...)))`

**Symptom:** DevTools shows the new slice, but the UI does not update.
**Cause:** You omitted one of the three middlewares. The canonical pattern
is documented in `AGENTS.md` and `ADR-002`; Athena v2 found 13 stores
missing `immer` (Apollo's first post-push P0).
**Fix:** Wrap in `subscribeWithSelector(persist(immer((set, get) => ({...})), { name, storage: masterStorage }))`.

### Pitfall 3 — Float math on money

**Symptom:** `0.1 + 0.2 === 0.30000000000000004` and your totals are off
by a cent per row.
**Cause:** Using `number` for currency. Hephaestus flagged 6 engines
(`TaxEngine`, `SaaSMetricsEngine`, `DriverCascadeEngine`, `AllocationEngine`,
`SpreadEngine`, `CubeEngine`) for float bugs; ADR-004 mandates `Decimal.js`.
**Fix:** `import { Decimal } from 'decimal.js'` and use `new Decimal(x).plus(y)`.

### Pitfall 4 — `<label>` without `htmlFor`

**Symptom:** Lighthouse a11y audit reports `Labels must be programmatically
associated with controls` (WCAG 3.3.2).
**Cause:** `<label>Email</label><input ... />` — no association. Hera's
audit found 35 files with a wholesale `eslint-disable jsx-a11y/label-has-associated-control`
that hides this exact problem.
**Fix:** `<label htmlFor="email">Email</label><input id="email" ... />`
or wrap the input inside the label.

### Pitfall 5 — `useEffect` with no cleanup

**Symptom:** Memory grows on every route change.
**Cause:** `useEffect(() => { window.addEventListener(...) }, [])` with
no return cleanup. Athena's audit flagged this in `CommandPalette.tsx:66`
(a real leak Apollo is fixing).
**Fix:** Return a cleanup: `useEffect(() => { window.addEventListener(...); return () => window.removeEventListener(...); }, [])`.

### Pitfall 6 — Mocking `WorkerPool` in tests

**Symptom:** 13 of the failing tests are your fault.
**Cause:** You wrote `vi.mock('@/workers/WorkerPool', () => ({ WorkerPool: class {} }))`
in a test setup. The mock API does not match the real one; Apollo's P0 #0
is the proper fix (delete PascalCase duplicate + fix lucide-react mock).
**Fix:** Do not mock `WorkerPool`; let the real one run in tests.

### Pitfall 7 — Touching a `light-only` component

**Symptom:** Dark mode renders pure white text on a white background.
**Cause:** 7 components (Hera P1 list) have no `dark:` variants yet:
`ErrorState`, `CurrencyInput`, `NLQInput`, `ExportMenu`, `SheetTabs`,
`Progress`, `EmptyState`. Touching them is fine — just add the `dark:`
prefixes per `docs/design/dark-mode.md` (if you find this missing, ask
in Slack — it was being drafted when this guide was written).

---

## 4. The 5-minute mental model

If you only have 5 minutes to grok the codebase, internalize this:

```
React UI  →  zustand store  →  OLAP cube (CubeEngine)
                                ↓
                              202 engines (CapEx, MonteCarlo, etc.)
                                ↓
                              masterStorage  →  Tauri SQLite / sql.js
```

Everything else is detail. **Start with the cube, everything else orbits it.**
The engines are pure functions on cube data; the stores are thin React
state caches; the components are presentation; the workers are off-thread
engines for heavy compute (Monte Carlo, large consolidations).

---

## 5. Next steps

- **Hour 2-4:** Read the rest of the ADRs, then 3 of the JSDoc drafts
  you didn't cover in minute 20-25.
- **Day 2:** Pick a P3 issue. Submit the PR following the checklist above.
- **Day 3-5:** Get code review. Iterate. Land your first commit.
- **Week 2:** Pick a P2 issue, then a P1. You are now a contributor.
- **Month 1:** You are qualified to review others' PRs and to take
  P0/P1 work.

Welcome to FinPlan Pro. The library is open. 🧠

---

## Cross-references

- **[GLOSSARY.md](./GLOSSARY.md)** — 21 FP&A terms (Allocation, COGS,
  EBITDA, IRR, NPV, Monte Carlo, FX Revaluation, etc.)
- **[docs/adr/ADR-002-zustand-state-management.md](./adr/ADR-002-zustand-state-management.md)**
- **[docs/adr/ADR-003-olap-cube-data-model.md](./adr/ADR-003-olap-cube-data-model.md)**
- **[docs/adr/ADR-004-decimal-js-currency-precision.md](./adr/ADR-004-decimal-js-currency-precision.md)**
- **[docs/adr/ADR-005-custom-masterstorage.md](./adr/ADR-005-custom-masterstorage.md)**
- **[docs/adr/ADR-006-schema-migration-strategy.md](./adr/ADR-006-schema-migration-strategy.md)**
- **[docs/drafts/jsdoc/](./jsdoc/)** — JSDoc drafts for the 5 critical exports
- **[docs/TESTING.md](./TESTING.md)** — Vitest guide for the 825 test files
- **[docs/diagrams/ARCHITECTURE.md](./diagrams/ARCHITECTURE.md)** — combined Mermaid view
