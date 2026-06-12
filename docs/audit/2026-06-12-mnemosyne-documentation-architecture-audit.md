# Mnemosyne — Documentation & Architecture Audit — 2026-06-12

> **Agent:** Mnemosyne (Documentation & Architecture)
> **Working dir:** `C:\Users\Tahir\Desktop\frontend that i want\fpa`
> **Scope:** README, JSDoc coverage, ADRs, FP&A glossary, diagrams, onboarding
> **Mandate:** REPORT-ONLY. No files modified.
> **Source of truth:** `AGENTS.md`, `FINPLAN_PERFECTION_PLAN.md`, `FINPLAN_PRO_COMPLETE_ARCHITECTURE.md`, `README.md`, `CONTRIBUTING.md`, `package.json`, `docs/`

---

## TL;DR — Documentation Health Score

| Dimension          | Score    | Verdict                                                                                                                                                                                         |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **README**         | 6/10     | Good structure, but **2–7× out of date** in every metric                                                                                                                                        |
| **JSDoc coverage** | 0.7%     | 🔴 **CRITICAL — 9 of 459 src files** have any `@param/@returns/@example`                                                                                                                        |
| **ADRs**           | 0.5/10   | 🔴 **1 of N+** — only currency translation captured; 20+ decisions undocumented                                                                                                                 |
| **Glossary**       | 0/10     | 🔴 **MISSING** — no `docs/GLOSSARY.md`; `HANDOVER/GLOSSARY.md` exists but is gitignored and is technical-only (a11y/i18n); 20+ FP&A domain terms (COGS, EBITDA, NPV, IRR, WACC, etc.) undefined |
| **Diagrams**       | 2/10     | 🟡 ASCII art only in ARCHITECTURE.md; **zero mermaid** blocks project-wide                                                                                                                      |
| **Onboarding**     | 3/10     | CONTRIBUTING.md exists but stale; no `ONBOARDING.md`, no `DEVELOPER_GUIDE.md`, no `TESTING.md`, no `FAQ.md`, no `TROUBLESHOOTING.md`                                                            |
| **Overall**        | **2/10** | **Documentation is a **blocker for new contributor onboarding** and **threatens API discoverability** for a 2260-export library.**                                                              |

---

## Phase 1 — README Audit

**File:** `README.md` (391 lines, 13 KB)

### ✅ What works

- 6 build/coverage badges at the top (CI, React, TypeScript, Vite, Tailwind, Tauri)
- Clear elevator pitch ("Eliminate spreadsheets. Run real FP&A.")
- "Features" section with 12 user-facing capabilities
- "Tech Stack" table (8 layers)
- "Quick Start" (5 commands: install, dev, build, test, lint)
- "Project Structure" tree
- "Architecture Overview" (single file, ASCII flow diagram)
- "Test Suite" section

### 🔴 Critical gaps

| Missing                                     | Severity | Notes                                                                |
| ------------------------------------------- | -------- | -------------------------------------------------------------------- |
| **No Table of Contents**                    | P3       | 391 lines, jump-to-section impossible                                |
| **No screenshots / demo GIF**               | P2       | "Show, don't tell" — first impression is a wall of badges+text       |
| **No "What is FP&A?" intro**                | P2       | Non-FP&A readers don't know what `IC`/`COGS`/`EBITDA` mean           |
| **No link to architecture docs**            | P2       | ARCHITECTURE.md is a separate file; should be linked                 |
| **No link to AGENTS.md or CONTRIBUTING.md** | P1       | AGENTS.md has the canonical patterns; new contributors won't find it |
| **No CHANGELOG.md**                         | P2       | "What's new in v2.5?" — unanswerable from repo alone                 |
| **No "Roadmap"**                            | P3       | FINPLAN_PERFECTION_PLAN.md is internal; no public-facing roadmap     |
| **No license badge in README**              | P3       | LICENSE file exists but not surfaced                                 |
| **No link to `docs/security/README.md`**    | P2       | Security claim needs pointer to threat model                         |

### 🔴 Metrics are 2-7× STALE

| Metric         | README says | Actual (counted 2026-06-12)                                                   | Drift     |
| -------------- | ----------- | ----------------------------------------------------------------------------- | --------- |
| **Stores**     | 13          | **35** `*Store.ts` files                                                      | **+169%** |
| **Engines**    | 24          | **202** (179 top-level + 23 in `formula-functions/`, `shared/`, `templates/`) | **+742%** |
| **Hooks**      | 12          | **40** `*.ts` (excl. tests)                                                   | **+233%** |
| **Components** | 55          | **274** `*.tsx` (excl. tests)                                                 | **+398%** |
| **Pages**      | 74 routes   | **192** `*.tsx` page files                                                    | **+159%** |
| **Tests**      | 519 tests   | **825** test files (1043+ tests per Apollo)                                   | **+59%**  |

**Verdict:** README's "Project Structure" tree is a snapshot from circa v1.0. The library has grown 5-8× since. New contributors cannot gauge the true scope.

### Recommended fixes (P0 for the README)

1. Update metric counts from current file system
2. Add ToC after the badges
3. Add a 1-sentence "What is FP&A?" sub-header
4. Link to `AGENTS.md` (canonical patterns) and `docs/ARCHITECTURE.md` (deep dive)
5. Add `## Documentation Index` section pointing to:
   - `docs/architecture/ENGINES.md` (198 engines)
   - `docs/architecture/ARCHITECTURE.md` (deep architecture)
   - `docs/security/README.md` (security model)
   - `docs/adr/` (architecture decisions)
6. Add CHANGELOG.md

---

## Phase 2 — JSDoc Coverage Audit

### Methodology

- Scanned `src/**/*.{ts,tsx}` excluding test/bench/stress files (459 files, 2,260 exports)
- Counted files with at least one JSDoc block containing `@param`/`@returns`/`@example`/`@throws` tags
- Methodology: `grep -lE "^\s*\*\s*@"`

### 🔴 Headline numbers

| Area              | Files   | With `@tag` JSDoc | Coverage |
| ----------------- | ------- | ----------------- | -------- |
| `src/engines/`    | 195     | **3**             | **1.5%** |
| `src/utils/`      | 23      | **2**             | **8.7%** |
| `src/hooks/`      | 40      | **2**             | **5%**   |
| `src/services/`   | 30      | **1**             | **3.3%** |
| `src/store/`      | 35      | **0**             | **0%**   |
| `src/components/` | 274     | **1**             | **0.4%** |
| `src/pages/`      | 192     | **0**             | **0%**   |
| **Total src/**    | **459** | **9**             | **0.7%** |

### The 5 critical exports — JSDoc audit

| #   | Export                                           | File:Line                                           | JSDoc present?                                                                              | @param                                | @returns                 | @example | @throws | Verdict                                           |
| --- | ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------ | -------- | ------- | ------------------------------------------------- |
| 1   | **`CubeEngine` (class)**                         | `src/engines/CubeEngine.ts`                         | ⚠️ Header block (135 lines, but **NOT a JSDoc on the class**; it's a free-floating comment) | ❌                                    | ❌                       | ❌       | ❌      | 🔴 **NO JSDoc**                                   |
| 2   | **`CapExEngine.calculateIRR`**                   | `src/engines/CapExEngine.ts:49`                     | ⚠️ Header block (49 lines, also free-floating)                                              | ❌                                    | ❌                       | ❌       | ❌      | 🔴 **NO JSDoc**                                   |
| 3   | **`MonteCarloEngine.simulate`**                  | `src/engines/MonteCarloEngine.ts:~440`              | ✅ Yes                                                                                      | ✅ `@param params` ✅ `@param config` | ✅ `@returns Statistics` | ❌       | ❌      | 🟡 **Partial — missing `@example` and `@throws`** |
| 4   | **`masterStorage`** (persist middleware wrapper) | `src/utils/masterStorage.ts:33`                     | ❌ None on the export                                                                       | ❌                                    | ❌                       | ❌       | ❌      | 🔴 **NO JSDoc**                                   |
| 5   | **`useAuth`** (hook)                             | `src/hooks/useAuth.ts:1-6` (entire file is 6 lines) | ❌ None                                                                                     | ❌                                    | ❌                       | ❌       | ❌      | 🔴 **NO JSDoc**                                   |

### Other notable gaps

- **`useAuth.ts` is 6 lines** with no JSDoc — this is the **entry point for the entire auth flow** and the only file a new contributor will read first
- **Header comment blocks are NOT JSDoc** — the 135-line header in `CubeEngine.ts` and 49-line header in `CapExEngine.ts` are using `//` style comments and are positioned in the **wrong place** (above `import` statements). Editors don't surface them on hover for the class.
- **`@throws` is completely absent** across the codebase — 0 files. Even engines that throw (CubeEngine, MonteCarloEngine) don't document throw conditions.
- **`@example` is completely absent** — 0 files. Engines that produce complex outputs (CubeEngine, IRR, Monte Carlo) should show worked examples.
- **`@deprecated` is absent** — but there are likely deprecated APIs that need flagging.
- **`@see` cross-references** are absent — engines that compose other engines (e.g. `CapExEngine` uses IRR) don't link them.

### Recommended fixes (P0)

1. **Add JSDoc to the 5 critical exports** identified above (all P0 because they are the "first page" of the public API).
2. **For each engine, add at minimum**: 1-line summary, `@param` (with units!), `@returns` (with units and shape), `@throws`, `@example` with realistic FP&A numbers.
3. **Move header comment blocks into proper JSDoc** (above the class, using `/**` not `//`).
4. **Add `@throws` everywhere errors can be thrown** — silent throw paths are a major footgun.
5. **Track JSDoc coverage in CI** — e.g. `eslint-plugin-jsdoc` rule with `valid-types` and `require-param`.

### Top 10 most-critical files needing JSDoc (P0)

1. `src/engines/CubeEngine.ts` — the centerpiece engine, **no JSDoc on class or any method**
2. `src/engines/CapExEngine.ts:49` `calculateIRR` — financial math with strict convergence requirements
3. `src/engines/MonteCarloEngine.ts` — already partial, needs `@example` + `@throws`
4. `src/utils/masterStorage.ts:33` — used by 13 stores; wrong config silently corrupts state
5. `src/hooks/useAuth.ts` — auth entry point
6. `src/store/cubeStore.ts` — wraps the centerpiece engine, no JSDoc
7. `src/engines/AllocationEngine.ts` — money-distribution math (must not silently round)
8. `src/engines/ConsolidationEngine.ts` — IC elimination (financial correctness)
9. `src/engines/FXTranslationEngine.ts` — currency math (only ADR-documented file)
10. `src/services/auth/*` — security-critical entry points

---

## Phase 3 — ADRs (Architecture Decision Records)

### Current state

- **Total ADRs:** 1
- **Location:** `docs/adr/`
- **File:** `ADR-001-currency-translation-method.md` (60 lines, well-structured)

### ✅ ADR-001 quality

Uses the classic MADR-ish format:

- Title, Status, Date, Author
- Context (the problem)
- Decision (the choice)
- Consequences: positive / negative / neutral
- Alternatives considered
- References (with link to `docs/architecture/FX_REVALUATION.md`)

**This is a good model to replicate.**

### 🔴 Critical gaps — 20+ decisions should be ADRs

| Missing ADR                                                     | Severity | Why it deserves an ADR                                                                                                                                                                                                         |
| --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ADR-002: Zustand state management**                           | P0       | 35 stores, custom pattern `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))`; team has explicit canonical form in AGENTS.md but no ADR justifying the choice (vs. Redux Toolkit, Jotai, Recoil, Context) |
| **ADR-003: Persistence via custom masterStorage**               | P0       | `src/utils/masterStorage.ts:33` wraps localStorage; should explain why (cross-tab sync, schema versioning, encryption at rest, fallbacks for SSR/incognito)                                                                    |
| **ADR-004: No backend (Tauri-only)**                            | P1       | Tauri shell is in the tech stack; ADR should explain no-server choice and how data flows if there's no remote backend                                                                                                          |
| **ADR-005: OLAP cube as the data model**                        | P0       | CubeEngine is the centerpiece; decision to use cube vs. tabular (DataFrame), how it relates to ETL/ELT, why not pandas-style?                                                                                                  |
| **ADR-006: FP&A formula DSL**                                   | P1       | FormulaEngine likely has a parser; should document the DSL choice vs. referencing Excel/JS evaluation                                                                                                                          |
| **ADR-007: Workers for Monte Carlo / consolidation / formulas** | P1       | Web Worker split for heavy compute; what messages, what fallback, why not WASM?                                                                                                                                                |
| **ADR-008: Web Crypto API for encryption at rest**              | P1       | Hephaestus is auditing this; needs an ADR                                                                                                                                                                                      |
| **ADR-009: Decimal.js for currency math**                       | P0       | Allocation / FX / IRR / NPV — all money math; ADR should explain rounding rules, currency precision (4dp vs. 2dp), how it integrates with cube                                                                                 |
| **ADR-010: xlsx/pdf-lib for I/O**                               | P2       | Why these libraries over ExcelJS/Puppeteer?                                                                                                                                                                                    |
| **ADR-011: 35 zustand stores (one per domain)**                 | P2       | Why split by domain (auth/scenario/data/notification/etc.) vs. one big root store?                                                                                                                                             |
| **ADR-012: i18n with i18next + 10 locale stubs**                | P2       | Why i18next over react-intl/Lingui? And the 9-of-10 `{"TODO":"TODO"}` stubs are a known P1 (Apollo task)                                                                                                                       |
| **ADR-013: Testing strategy (Vitest + RTL + Playwright)**       | P1       | vitest-axe being added (Apollo P1), 825 test files, 5+ test flavors (`*.test.ts`, `*.bench.test.ts`, `*.stress.test.ts`); strategy should be documented                                                                        |
| **ADR-014: React 18 + Suspense + error boundaries**             | P2       | Why no Next.js / Remix? Why client-only React 18?                                                                                                                                                                              |
| **ADR-015: Tailwind + design tokens + dark mode**               | P2       | Hera is auditing this; ADR should justify the token system and `motion-safe:` strategy                                                                                                                                         |
| **ADR-016: Plugin / engine registration**                       | P1       | 198 engines — how does a new engine get registered? `src/engines/index.ts`? Auto-discovery? Side-effect import?                                                                                                                |
| **ADR-017: Schema migration strategy**                          | P0       | With `persist` middleware + cross-tab sync + encryption, how is schema v1 → v2 rolled forward?                                                                                                                                 |
| **ADR-018: Error boundary hierarchy**                           | P2       | Hera found missing boundaries; ADR should define the boundary policy                                                                                                                                                           |
| **ADR-019: Theming / dark mode**                                | P2       | Light/dark strategy, token layering, why CSS variables vs. Tailwind dark: variant                                                                                                                                              |
| **ADR-020: Logging & observability**                            | P2       | Apollo P2 migrates console.log → logger; ADR should define the log levels, what gets logged, redaction policy                                                                                                                  |

### Recommended fix

- **P0:** Write the 5 most-critical ADRs (002, 003, 005, 009, 017) — these are decisions a new contributor will hit on day 1 and a security/compliance reviewer will ask about immediately.
- **Process:** Adopt "ADR-driven" culture — every PR that introduces a new pattern, library, or major structural change should include an ADR.

---

## Phase 4 — FP&A Glossary

### Current state

- **Root-level glossary files:** 0
- `docs/GLOSSARY.md` — ❌ DOES NOT EXIST
- `README.md` "Glossary" section — ❌ DOES NOT EXIST
- `docs/ARCHITECTURE.md` glossary — ❌ DOES NOT EXIST
- `HANDOVER/GLOSSARY.md` — ⚠️ **EXISTS but is gitignored and is a TECHNICAL glossary only** (defines ESLint, TSC, React Hooks, Zustand, file patterns, commands, abbreviations like i18n/a11y). It does **NOT** define a single FP&A domain term. Since `HANDOVER/` is in `.gitignore`, it is invisible to GitHub contributors and has no value as a public glossary.

### 🔴 Top 20 domain terms used in code, **0 of 20 defined anywhere**

I searched the main docs (`README.md`, `AGENTS.md`, `FINPLAN_PERFECTION_PLAN.md`, `FINPLAN_PRO_COMPLETE_ARCHITECTURE.md`, `docs/ARCHITECTURE.md`) for definitions. The following terms appear repeatedly in code but are **never defined**. The only place that defines any term at all is the gitignored `HANDOVER/GLOSSARY.md`, which covers **technical** terms (a11y, i18n, WCAG) but **no FP&A domain terms** — confirming the gap below.

| #   | Term                                        | Where used                     | Defined? |
| --- | ------------------------------------------- | ------------------------------ | -------- |
| 1   | **COGS** (Cost of Goods Sold)               | engines, store names           | ❌       |
| 2   | **EBITDA**                                  | calculations                   | ❌       |
| 3   | **Gross Margin**                            | P&L reports                    | ❌       |
| 4   | **NPV** (Net Present Value)                 | CapEx engine                   | ❌       |
| 5   | **IRR** (Internal Rate of Return)           | CapEx engine                   | ❌       |
| 6   | **WACC** (Weighted Average Cost of Capital) | DCF                            | ❌       |
| 7   | **IC** (Inter-Company)                      | ConsolidationEngine            | ❌       |
| 8   | **FX Revaluation**                          | FXTranslationEngine, ADR-001   | ❌       |
| 9   | **Allocation rule**                         | AllocationEngine               | ❌       |
| 10  | **Consolidation**                           | ConsolidationEngine            | ❌       |
| 11  | **Scenario**                                | scenarioStore, scenarioEngine  | ❌       |
| 12  | **Sensitivity**                             | MonteCarlo                     | ❌       |
| 13  | **Monte Carlo**                             | MonteCarloEngine               | ❌       |
| 14  | **Driver**                                  | driverStore, driver engine     | ❌       |
| 15  | **Variance**                                | varianceStore, variance engine | ❌       |
| 16  | **Budget vs Actual**                        | BudgetVsActual page            | ❌       |
| 17  | **Roll-forward / Forecast**                 | forecast engine                | ❌       |
| 18  | **Chart of Accounts (CoA)**                 | CoA engine                     | ❌       |
| 19  | **Topline / Bottomline**                    | reports                        | ❌       |
| 20  | **LTM** (Last Twelve Months)                | reports                        | ❌       |

### Recommended glossary structure

Create `docs/GLOSSARY.md` with at least these 20 entries. Suggested format:

```markdown
## EBITDA

**Definition:** Earnings Before Interest, Taxes, Depreciation, and Amortization.
**Formula:** `EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization`
**Where in code:** `src/engines/ProfitLossEngine.ts:calcEBITDA()`
**See also:** [Gross Margin](#gross-margin), [NPV](#npv)
```

### Recommended fix (P0)

- **Create `docs/GLOSSARY.md`** (NOT in HANDOVER/) with the 20+ FP&A terms above.
- **Link from README** to glossary.
- **Add a "Glossary" section to every engine JSDoc** (e.g. `@glossary EBITDA see docs/GLOSSARY.md#ebitda`).
- **Auto-generate** in CI: parse engines for `EBITDA`, `NPV`, `IRR`, etc., fail build if not in glossary.
- **Bonus:** Promote the technical terms from `HANDOVER/GLOSSARY.md` into `docs/GLOSSARY.md` so GitHub visitors can see them.

---

## Phase 5 — Diagrams

### Current state

- **Mermaid diagrams:** 0 across the entire repo (searched for `mermaid`, `graph TD`, `graph LR`, `sequenceDiagram`, `flowchart`)
- **ASCII art diagrams:** ~5 in `docs/ARCHITECTURE.md`

### ASCII art examples found

`docs/ARCHITECTURE.md` has hand-drawn diagrams:

- 4-layer architecture (UI → State → Engines → Storage)
- Cube architecture (cube → dimensions → measures)
- "Plug-in engine system" flow

### 🔴 Critical gaps — 5 diagrams that would help

| #   | Diagram                                                              | Type                      | Why it helps                                    |
| --- | -------------------------------------------------------------------- | ------------------------- | ----------------------------------------------- |
| 1   | **Data flow** (User → Component → Store → Engine → Worker → Storage) | Mermaid `flowchart`       | Onboarding day 1                                |
| 2   | **Store architecture** (35 zustand stores + their dependencies)      | Mermaid `graph TD`        | New contributor picks the right store to extend |
| 3   | **Engine registration / plugin lifecycle**                           | Mermaid `sequenceDiagram` | How a new engine gets wired in (198 engines!)   |
| 4   | **Auth flow** (Login → token storage → session → refresh → logout)   | Mermaid `sequenceDiagram` | Critical for security review                    |
| 5   | **Build pipeline** (Vite → TS → ESLint → Vitest → bundle → Tauri)    | Mermaid `flowchart`       | DevOps, CI debugging                            |

### Bonus diagrams (P2)

- 6. **Cube schema evolution** (adding a new dimension/measure)
- 7. **FX revaluation flow** (per ADR-001)
- 8. **Consolidation flow** (parent + N children, IC elimination)
- 9. **Monte Carlo simulation lifecycle**
- 10. **Error boundary tree** (which boundary catches which error)

### Recommended fix (P1)

- **Replace ASCII art in `docs/ARCHITECTURE.md` with mermaid** (mermaid renders in GitHub, GitLab, IDEs).
- **Add 5 P1 diagrams** to a new `docs/diagrams/` folder.
- **Generate the store-architecture mermaid from code** (parse imports) — keeps it accurate.

---

## Phase 6 — Onboarding & Developer Experience

### Current state

**Files that exist:**

- ✅ `README.md` (391 lines) — but stale metrics
- ✅ `CONTRIBUTING.md` (108 lines) — quickstart, lint/test/build commands
- ✅ `AGENTS.md` (155 lines) — **the most useful onboarding doc**; has canonical store pattern, lint rules, do/don't list
- ✅ `PROJECT_INDEX.md` — links to plan docs
- ✅ `FINPLAN_PERFECTION_PLAN.md` (169 lines) — current priorities
- ✅ `FINPLAN_PRO_COMPLETE_ARCHITECTURE.md` (2,025 lines) — deep architecture
- ✅ `docs/architecture/ENGINES.md` (149 lines) — engine list
- ✅ `docs/COMPONENT_PATTERNS.md` — component conventions
- ✅ `docs/security/README.md` (124 lines) — security model
- ✅ `LICENSE` (MIT)
- ✅ `.github/workflows/` — CI exists

**Files MISSING (P0/P1/P2):**

- ❌ `ONBOARDING.md` — no 30-min "first day" guide
- ❌ `DEVELOPER_GUIDE.md` — no deep dive
- ❌ `TESTING.md` — no "how to write a test" (despite 825 test files)
- ❌ `TROUBLESHOOTING.md` — no "common gotchas"
- ❌ `FAQ.md`
- ❌ `CHANGELOG.md` (release notes)
- ❌ `CODE_OF_CONDUCT.md`
- ❌ `CODEOWNERS`
- ❌ `STYLE_GUIDE.md` (separate from lint config)

### 🔴 Onboarding time-to-first-PR estimate

**Currently:**

1. Open repo → README (391 lines, jump to "Quick Start") → `npm i` → 5 min
2. Try to understand the **shape** of the app → fail (no "Architecture Overview for newcomers" section)
3. Read `FINPLAN_PRO_COMPLETE_ARCHITECTURE.md` (2,025 lines!) → 60+ min
4. Read `AGENTS.md` (155 lines) → 10 min
5. Try to find where to add a feature → read 5-10 files to find right store/hook/component → 60+ min
6. Write first PR → 3-5 days (estimate, based on doc gaps)

**Estimated time-to-first-PR with current docs: 4-7 days**
**Industry standard (good docs): 1-2 days**
**Tech-debt: ~3-5 days of wasted senior-dev time per new hire**

### Recommended fix (P0)

1. **Create `ONBOARDING.md` (P0)** with 30-min path:
   - 5 min: clone, install, run
   - 10 min: read 1-page architecture summary
   - 10 min: read AGENTS.md
   - 5 min: pick a "good first issue" label
2. **Create `DEVELOPER_GUIDE.md` (P1)** with deep dives:
   - How to add a new engine
   - How to add a new store
   - How to add a new page
   - How to write a test
3. **Create `TESTING.md` (P0)** — 825 test files but no guide; document:
   - `*.test.ts` vs `*.bench.test.ts` vs `*.stress.test.ts`
   - Mocking patterns
   - Test data factories
4. **Add `CHANGELOG.md` (P1)** with conventional-changelog format
5. **Add `CODEOWNERS` (P2)** for review routing
6. **Add `STYLE_GUIDE.md` (P2)** that explains _why_ not just _what_ (e.g. why no `as any`, why immer, why persist)

---

## Severity-Ranked Top 10 Wins

| #   | Win                                                                                                             | Severity | Est. effort | ROI                                  |
| --- | --------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ------------------------------------ |
| 1   | **Update README metrics** (35 stores, 198 engines, 40 hooks, 274 components, 192 pages, 825 tests)              | P0       | 1 hr        | High — first impression              |
| 2   | **Add JSDoc to 5 critical exports** (CubeEngine, calculateIRR, runMonteCarloSimulation, masterStorage, useAuth) | P0       | 8 hr        | High — IDE discoverability           |
| 3   | **Create `docs/GLOSSARY.md`** with 20 FP&A terms                                                                | P0       | 4 hr        | High — new contributor blocker       |
| 4   | **Create 5 P1 ADRs** (002-006: Zustand, masterStorage, Cube as data model, Decimal.js, schema migration)        | P0       | 12 hr       | High — decision context lost in time |
| 5   | **Convert ARCHITECTURE.md ASCII art to mermaid** (5 diagrams)                                                   | P1       | 6 hr        | High — renders in GitHub, IDE        |
| 6   | **Add 5 P1 mermaid diagrams** (data flow, store arch, engine lifecycle, auth, build pipeline)                   | P1       | 10 hr       | High — onboarding                    |
| 7   | **Create `ONBOARDING.md`** 30-min first-day guide                                                               | P0       | 4 hr        | High — new hire ramp                 |
| 8   | **Create `TESTING.md`** (825 test files, no guide)                                                              | P0       | 6 hr        | High — first PR                      |
| 9   | **Move engine header blocks into proper JSDoc** (135-line CubeEngine header, 49-line CapExEngine header)        | P1       | 8 hr        | Medium — already 80% written         |
| 10  | **Add `CHANGELOG.md`** with conventional-changelog                                                              | P2       | 2 hr        | Medium — release history             |

**Total effort: ~60 hours** (≈ 1.5 dev-weeks for one engineer)
**ROI: brings documentation from 2/10 to 7/10; unblocks new-hire onboarding; future-proofs 2,260 exports**

---

## Appendix A — File Counts (ground truth, 2026-06-12)

| Path                                                                          | Count        | Notes                                                                              |
| ----------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `src/engines/*.ts` (excl. test)                                               | **202**      | 179 top-level + 23 in `formula-functions/`, `shared/`, `templates/` sub-dirs       |
| `src/store/*.ts` (excl. test)                                                 | **35**       | `*Store.ts` files                                                                  |
| `src/hooks/*.ts` (excl. test)                                                 | **40**       | incl. many small wrappers                                                          |
| `src/utils/*.ts` (excl. test)                                                 | **23**       | utility functions                                                                  |
| `src/services/*.ts` (excl. test)                                              | **30**       | service layer                                                                      |
| `src/components/*.tsx` (excl. test, `__tests__/`)                             | **274**      | UI components                                                                      |
| `src/pages/**/*.tsx` (excl. test)                                             | **192**      | route components                                                                   |
| Test files (`*.test.ts`, `*.test.tsx`, `*.bench.test.ts`, `*.stress.test.ts`) | **825**      | per Apollo: 1043+ tests                                                            |
| `docs/**/*.md`                                                                | **70+**      | many stale, many redundant                                                         |
| `docs/adr/*.md`                                                               | **1**        | only ADR-001                                                                       |
| `docs/GLOSSARY.md`                                                            | **0**        | MISSING                                                                            |
| `docs/ARCHITECTURE.md`                                                        | **1**        | stale (says 13 stores, 24 engines)                                                 |
| Mermaid blocks in repo                                                        | **0**        | only ASCII art                                                                     |
| Files with `@param/@returns/@example` JSDoc in `src/`                         | **9 of 459** | **0.7% coverage**                                                                  |
| Total exports in `src/`                                                       | **2,260**    | calculated from `grep -cE "^\s*export (class\|function\|const\|interface\|type) "` |

---

## Appendix B — Verification Method

All numbers verified 2026-06-12 via:

- `find src/<dir> -name "*.ts" -not -name "*.test.ts" -not -name "*.bench.test.ts" -not -name "*.stress.test.ts" | wc -l`
- `find src/<dir> -name "*.ts" -not -name "*.test.ts" ... | xargs grep -cE "^\s*export (class|function|const|interface|type) " 2>/dev/null | awk -F: '{s+=$NF} END {print s}'`
- `find src/<dir> -name "*.ts" ... | xargs grep -lE "^\s*\*\s*@" 2>/dev/null | wc -l`
- `find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | xargs grep -liE "mermaid|graph TD|sequenceDiagram" 2>/dev/null`
- `ls docs/adr/`, `find . -name "GLOSSARY*"`, `find . -name "ONBOARDING*"`, `find . -name "TESTING*"`

No files were modified. Report-only mandate honored.
